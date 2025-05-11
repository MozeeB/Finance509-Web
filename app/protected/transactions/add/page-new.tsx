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

// Define form schema
const formSchema = z.object({
  date: z.string().min(1, { message: "Date is required" }),
  account_id: z.string().min(1, { message: "Please select an account" }),
  type: z.enum(["Income", "Expense"], { 
    required_error: "Please select a transaction type" 
  }),
  category: z.string().min(1, { message: "Category is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  total: z.coerce.number().min(0.01, { message: "Amount must be greater than 0" }),
});

export default function AddTransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [toast, setToastMessage] = useState<{
    title: string;
    description: string;
    variant?: "default" | "destructive";
  } | null>(null);
  const supabase = createClientComponentClient();
  
  // Categories based on transaction type
  const categories = {
    Income: ["Salary", "Investment", "Gift", "Refund", "Other Income"],
    Expense: ["Food", "Transportation", "Housing", "Utilities", "Entertainment", "Healthcare", "Miscellaneous"]
  };

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      account_id: "",
      type: "Expense",
      category: "",
      description: "",
      total: 0,
    },
  });

  // Get the current selected transaction type
  const transactionType = form.watch("type");
  
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
  
  // Simple toast function
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
        return;
      }
      
      // Insert new account
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .insert({
          name: newAccountName,
          type: 'Cash', // Default type
          is_active: true,
          user_id: user.id, // Associate with current user
          value: 0,
          currency: 'USD',
          created_at: new Date().toISOString()
        })
        .select();
      
      if (accountError) throw accountError;
      
      if (accountData && accountData[0]) {
        // Create account balance record
        await supabase
          .from('account_balances')
          .insert({
            account_id: accountData[0].id,
            current_value: 0,
            transaction_total: 0
          });
        
        showToast("Account created", "Your new account has been created successfully.");
        
        // Add the new account to the accounts list
        setAccounts([...accounts, accountData[0]]);
        
        // Set the new account as the selected account
        form.setValue('account_id', accountData[0].id);
        
        // Close the account form
        setShowAccountForm(false);
      }
    } catch (error) {
      console.error('Error creating account:', error);
      showToast("Error", "There was a problem creating your account. Please try again.", "destructive");
    } finally {
      setIsCreatingAccount(false);
      setNewAccountName('');
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
      
      // Format the data
      const transactionData = {
        ...values,
        month: new Date(values.date).toLocaleString('default', { month: 'long' }),
        total: values.type === "Expense" ? -Math.abs(values.total) : Math.abs(values.total),
      };
      
      // Insert transaction
      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select();
        
      if (error) throw error;
      
      // Update account_balances
      const { data: accountData, error: accountError } = await supabase
        .from('account_balances')
        .select('transaction_total, current_value')
        .eq('account_id', values.account_id)
        .single();
        
      if (!accountError && accountData) {
        const newTransactionTotal = accountData.transaction_total + transactionData.total;
        const newCurrentValue = accountData.current_value + transactionData.total;
        
        await supabase
          .from('account_balances')
          .update({ 
            transaction_total: newTransactionTotal,
            current_value: newCurrentValue
          })
          .eq('account_id', values.account_id);
      }
      
      showToast("Transaction added", "Your transaction has been successfully recorded.");
      
      router.push('/protected/transactions');
      router.refresh();
    } catch (error) {
      console.error('Error adding transaction:', error);
      showToast("Error", "There was a problem adding your transaction. Please try again.", "destructive");
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
                            <option value="Income">Income</option>
                            <option value="Expense">Expense</option>
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
                            <option value="">Select a category</option>
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
