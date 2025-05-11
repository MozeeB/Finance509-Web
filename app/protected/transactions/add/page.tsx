"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ArrowLeft, PlusCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

// Define two schemas: one with account_id required and one with it optional
const baseFormSchema = {
  date: z.string().min(1, { message: "Date is required" }),
  type: z.enum(["income", "expense"], { 
    required_error: "Please select a transaction type" 
  }),
  category: z.string().min(1, { message: "Category is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  total: z.coerce.number().min(0.01, { message: "Amount must be greater than 0" }),
};

const formSchemaWithAccount = z.object({
  ...baseFormSchema,
  account_id: z.string().uuid({ message: "Please select an account" }),
});

// For when no accounts exist yet
const formSchemaNoAccount = z.object({
  ...baseFormSchema,
  account_id: z.string().optional(),
});

export default function AddTransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [toast, setToastMessage] = useState<{
    title: string;
    description: string;
    variant?: "default" | "destructive";
  } | null>(null);
  const supabase = createClientComponentClient();
  
  // State to store accounts
  const [accounts, setAccounts] = useState<any[]>([]);
  
  // Load accounts from URL or fetch them if not available
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        // Try to parse accounts from URL first
        const accountsParam = searchParams.get('accounts');
        if (accountsParam) {
          const parsedAccounts = JSON.parse(decodeURIComponent(accountsParam));
          if (Array.isArray(parsedAccounts) && parsedAccounts.length > 0) {
            setAccounts(parsedAccounts);
            return;
          }
        }
        
        // If no accounts in URL or empty array, fetch from database
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: fetchedAccounts } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', user.id)
            .order('name');
            
          if (fetchedAccounts && fetchedAccounts.length > 0) {
            setAccounts(fetchedAccounts);
          }
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
        showToast("Error", "Failed to load accounts", "destructive");
      }
    };
    
    loadAccounts();
  }, [searchParams, supabase]);
  
  // Use the appropriate schema based on whether accounts exist
  const formSchema = accounts.length > 0 ? formSchemaWithAccount : formSchemaNoAccount;
  
  // Initialize form with proper validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      account_id: "",
      type: "expense",
      category: "",
      description: "",
      total: 0,
    },
  });

  // Categories based on transaction type
  const categories = {
    income: ["Salary", "Investment", "Gift", "Refund", "Other Income"],
    expense: ["Food", "Transportation", "Housing", "Utilities", "Entertainment", "Healthcare", "Miscellaneous"]
  };

  // Get the current selected transaction type
  const transactionType = form.watch("type");
  
  // Reset form when accounts change
  useEffect(() => {
    if (accounts.length > 0) {
      form.reset({
        ...form.getValues(),
        account_id: form.getValues().account_id || accounts[0].id,
      });
    }
  }, [accounts, form]);

  // Simple toast function since we can't import the toast component
  const showToast = (title: string, description: string, variant: "default" | "destructive" = "default") => {
    setToastMessage({ title, description, variant });
    setTimeout(() => setToastMessage(null), 5000);
  };

  async function createAccount() {
    if (!newAccountName.trim()) {
      showToast("Error", "Please enter an account name", "destructive");
      return;
    }
    
    setIsCreatingAccount(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showToast("Error", "You must be logged in to create an account", "destructive");
        setIsCreatingAccount(false);
        return;
      }
      
      // Create a clean account object
      const account = {
        name: newAccountName,
        type: 'Cash', // Default type
        is_active: true,
        user_id: user.id,
        value: 0,
        currency: 'USD',
        created_at: new Date().toISOString()
      };
      
      // Insert the account
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .insert(account)
        .select();
      
      if (accountError) {
        console.error('Error creating account:', accountError);
        showToast("Error", `Failed to create account: ${accountError.message}`, "destructive");
        setIsCreatingAccount(false);
        return;
      }
      
      if (accountData && accountData[0]) {
        showToast("Account created", "Your new account has been created successfully.");
        
        // Add the new account to the accounts list
        setAccounts(prevAccounts => [...prevAccounts, accountData[0]]);
        
        // Set the new account as the selected account in the form
        form.setValue('account_id', accountData[0].id);
        
        // Close the account form
        setShowAccountForm(false);
      } else {
        showToast("Error", "Account was created but no data was returned", "destructive");
      }
    } catch (error) {
      console.error('Error creating account:', error);
      showToast("Error", "There was a problem creating your account. Please try again.", "destructive");
    } finally {
      setIsCreatingAccount(false);
    }
  }
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      // If no accounts exist, show error and prompt to create one
      if (accounts.length === 0) {
        showToast("No accounts available", "Please create an account first before adding transactions.", "destructive");
        setShowAccountForm(true);
        setIsSubmitting(false);
        return;
      }
      
      // Make sure account_id is set if using formSchemaWithAccount
      if (formSchema === formSchemaWithAccount && !values.account_id) {
        showToast("Account required", "Please select an account for this transaction.", "destructive");
        setIsSubmitting(false);
        return;
      }
      
      // Get the account ID
      const accountId = values.account_id || (accounts.length > 0 ? accounts[0].id : null);
      
      if (!accountId) {
        showToast("Error", "No account selected for this transaction.", "destructive");
        setIsSubmitting(false);
        return;
      }
      
      // Calculate the amount based on transaction type
      const amount = values.type === "expense" 
        ? -Math.abs(Number(values.total)) 
        : Math.abs(Number(values.total));
      
      // Create a clean transaction object with only the fields needed
      const transaction = {
        date: values.date,
        account_id: accountId,
        type: values.type,
        category: values.category,
        description: values.description,
        total: amount,
        month: new Date(values.date).toLocaleString('default', { month: 'long' })
      };
      
      // Step 1: Insert the transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(transaction);
      
      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        showToast("Error", `Failed to create transaction: ${transactionError.message}`, "destructive");
        setIsSubmitting(false);
        return;
      }
      
      // Step 2: Update the account balance
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('value')
        .eq('id', accountId)
        .single();
      
      if (accountError) {
        console.error('Error fetching account:', accountError);
        // Continue even if we can't update the account
      } else {
        // Calculate new balance
        const currentBalance = account.value || 0;
        const newBalance = currentBalance + amount;
        
        // Update the account
        const { error: updateError } = await supabase
          .from('accounts')
          .update({ value: newBalance })
          .eq('id', accountId);
        
        if (updateError) {
          console.error('Error updating account balance:', updateError);
          // Continue even if update fails
        }
      }
      
      showToast("Transaction added", "Your transaction has been successfully recorded.");
      
      router.push('/protected/transactions');
      router.refresh();
    } catch (error) {
      console.error('Error adding transaction:', error);
      
      // More detailed error message
      let errorMessage = "There was a problem adding your transaction. Please try again.";
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage += ` Error: ${(error as any).message}`;
      }
      
      showToast("Error", errorMessage, "destructive");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      {/* Simple toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md ${
          toast.variant === "destructive" ? "bg-red-100 text-red-800 border border-red-200" : "bg-green-100 text-green-800 border border-green-200"
        }`}>
          <h4 className="font-semibold">{toast.title}</h4>
          <p className="text-sm">{toast.description}</p>
        </div>
      )}
      
      {accounts.length === 0 && !showAccountForm && (
        <div className="mint-card p-4 rounded-md bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">No accounts available</h3>
            <p className="text-sm mt-1">You need to create an account before you can add transactions.</p>
            <button 
              onClick={() => setShowAccountForm(true)}
              className="mint-button mt-3 text-sm py-1 px-3"
            >
              Create Account
            </button>
          </div>
        </div>
      )}
      
      {showAccountForm ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => setShowAccountForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <CardTitle>Create New Account</CardTitle>
            </div>
            <CardDescription>
              Create an account to start tracking your transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Create a simple form schema for account creation */}
            <div className="space-y-4">
              <div className="form-group">
                <label htmlFor="account-name" className="text-sm font-medium">Account Name</label>
                <Input 
                  id="account-name" 
                  placeholder="e.g., Checking Account" 
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowAccountForm(false)}
              disabled={isCreatingAccount}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={createAccount}
              disabled={isCreatingAccount}
            >
              {isCreatingAccount ? "Creating..." : "Create Account"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Link href="/protected/transactions" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <CardTitle>Add Transaction</CardTitle>
            </div>
            <CardDescription>
              Record a new income or expense transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="account_id"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Account</FormLabel>
                          <button
                            type="button"
                            onClick={() => setShowAccountForm(true)}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <PlusCircle className="h-3 w-3" />
                            New Account
                          </button>
                        </div>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                            disabled={accounts.length === 0}
                            onChange={(e) => {
                              field.onChange(e);
                              // Force re-validation after selection
                              form.trigger('account_id');
                            }}
                          >
                            <option value="">Select an account</option>
                            {accounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.name}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="" disabled>Select a category</option>
                            {categories[transactionType as keyof typeof categories].map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Grocery shopping" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="total"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Transaction"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
