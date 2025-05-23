"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '../../../../utils/auth-service';
import { Transaction, Account } from '../../../../types/database';
import { formatCurrency } from "../../../../utils/format";
import { ArrowLeft, Check, CreditCard, DollarSign, Calendar, Tag } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Define form schema with Zod - using lowercase for type values to match database constraints
const transactionSchema = z.object({
  date: z.string().nonempty("Date is required"),
  description: z.string().min(2, "Description must be at least 2 characters"),
  category: z.string().nonempty("Category is required"),
  account_id: z.string().uuid("Please select an account"),
  type: z.enum(["income", "expense"]),
  total: z.coerce.number().min(0.01, "Amount must be greater than 0"),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export default function AddTransactionPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // React Hook Form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: "expense", // lowercase to match database constraints
      total: undefined,
    },
  });

  // Watch the transaction type to adjust UI
  const transactionType = watch("type");
  const isIncome = transactionType.toLowerCase() === "income";

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const supabase = createClientComponentClient();
        
        // Get user
        const { success, user } = await getCurrentUser();
        
        if (!success || !user) {
          router.push("/sign-in");
          return;
        }

        // Fetch accounts
        const { data: accountsData } = await supabase
          .from('accounts')
          .select('*');
        
        setAccounts(accountsData || []);

        // Fetch existing categories from transactions for suggestions
        const { data: transactionsData } = await supabase
          .from('transactions')
          .select('category, type');
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set((transactionsData || []).map(t => t.category))
        ).filter(Boolean);
        
        setCategories(uniqueCategories);

        // Set default account if available
        if (accountsData && accountsData.length > 0) {
          setValue("account_id", accountsData[0].id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [router, setValue]);

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      setIsSaving(true);
      setError(null);
      
      const supabase = createClientComponentClient();
      
      // Get user
      const { success, user } = await getCurrentUser();
      
      if (!success || !user) {
        router.push("/sign-in");
        return;
      }
      
      // Format the amount based on transaction type
      const amount = data.type.toLowerCase() === "expense" 
        ? -Math.abs(data.total) 
        : Math.abs(data.total);
      
      // Get month from date for filtering/reporting
      const date = new Date(data.date);
      const month = date.toISOString().slice(0, 7); // YYYY-MM format
      
      console.log("Inserting transaction:", {
        date: data.date,
        month,
        description: data.description,
        category: data.category,
        account_id: data.account_id,
        type: data.type, // lowercase to match database constraints
        total: amount
      });
      
      // Create new transaction
      const { data: newTransaction, error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            date: data.date,
            month,
            description: data.description,
            category: data.category,
            account_id: data.account_id,
            type: data.type, // lowercase to match database constraints
            total: amount
          }
        ])
        .select()
        .single();

      if (transactionError) {
        console.error("Transaction error:", transactionError);
        throw new Error(transactionError.message);
      }
      
      // Update account balance
      const selectedAccount = accounts.find(a => a.id === data.account_id);
      
      if (selectedAccount) {
        const newBalance = Number(selectedAccount.value) + amount;
        
        const { error: accountError } = await supabase
          .from('accounts')
          .update({ value: newBalance })
          .eq('id', data.account_id);

        if (accountError) {
          console.error("Account update error:", accountError);
          throw new Error(accountError.message);
        }
      }
      
      setSuccess('Transaction added successfully!');
      
      // Redirect after short delay
      setTimeout(() => {
        router.refresh(); // Refresh the router cache
        router.push('/dashboard/transactions');
      }, 2000);
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      setError(error.message || 'Failed to save transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/dashboard/transactions" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">Add Transaction</h1>
        </div>
        <div className="mint-card p-8 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-32 bg-primary/20 rounded mb-4"></div>
            <div className="h-4 w-48 bg-primary/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard/transactions" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Add Transaction</h1>
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-[hsl(var(--income))]/10 text-[hsl(var(--income))] p-4 rounded-lg mb-6">
          <p className="font-medium">Success</p>
          <p className="text-sm">{success}</p>
        </div>
      )}
      
      <div className="mint-card p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Transaction Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Transaction Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer flex items-center gap-3 ${
                  isIncome
                    ? "border-[hsl(var(--income))] bg-[hsl(var(--income))]/10" 
                    : "border-muted hover:border-muted-foreground"
                }`}
                onClick={() => setValue("type", "income")}
              >
                <div className={`p-2 rounded-full ${
                  isIncome
                    ? "bg-[hsl(var(--income))]" 
                    : "bg-muted"
                }`}>
                  <DollarSign className={`h-5 w-5 ${
                    isIncome
                      ? "text-white" 
                      : "text-muted-foreground"
                  }`} />
                </div>
                <div>
                  <p className="font-medium">Income</p>
                  <p className="text-xs text-muted-foreground">Money you receive</p>
                </div>
                {isIncome && (
                  <Check className="ml-auto text-[hsl(var(--income))]" />
                )}
              </div>
              
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer flex items-center gap-3 ${
                  !isIncome
                    ? "border-[hsl(var(--expense))] bg-[hsl(var(--expense))]/10" 
                    : "border-muted hover:border-muted-foreground"
                }`}
                onClick={() => setValue("type", "expense")}
              >
                <div className={`p-2 rounded-full ${
                  !isIncome
                    ? "bg-[hsl(var(--expense))]" 
                    : "bg-muted"
                }`}>
                  <CreditCard className={`h-5 w-5 ${
                    !isIncome
                      ? "text-white" 
                      : "text-muted-foreground"
                  }`} />
                </div>
                <div>
                  <p className="font-medium">Expense</p>
                  <p className="text-xs text-muted-foreground">Money you spend</p>
                </div>
                {!isIncome && (
                  <Check className="ml-auto text-[hsl(var(--expense))]" />
                )}
              </div>
            </div>
            
            <input type="hidden" {...register("type")} />
          </div>

          {/* Amount & Date */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="total">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Amount
                </div>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  id="total"
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full pl-8 pr-3 py-2 border rounded-md ${errors.total ? 'border-destructive' : ''}`}
                  {...register("total")}
                />
              </div>
              {errors.total && (
                <p className="text-destructive text-xs mt-1">{errors.total.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="date">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Date
                </div>
              </label>
              <input
                type="date"
                id="date"
                className={`w-full px-3 py-2 border rounded-md ${errors.date ? 'border-destructive' : ''}`}
                {...register("date")}
              />
              {errors.date && (
                <p className="text-destructive text-xs mt-1">{errors.date.message}</p>
              )}
            </div>
          </div>

          {/* Description & Category */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="description">
                <div className="flex items-center gap-1">
                  Description
                </div>
              </label>
              <input
                type="text"
                id="description"
                placeholder="What was this for?"
                className={`w-full px-3 py-2 border rounded-md ${errors.description ? 'border-destructive' : ''}`}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-destructive text-xs mt-1">{errors.description.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="category">
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Category
                </div>
              </label>
              <input
                type="text"
                id="category"
                list="category-options"
                placeholder="Select or type a category"
                className={`w-full px-3 py-2 border rounded-md ${errors.category ? 'border-destructive' : ''}`}
                {...register("category")}
              />
              <datalist id="category-options">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
                {isIncome && !categories.includes("Salary") && (
                  <option value="Salary" />
                )}
                {isIncome && !categories.includes("Investment") && (
                  <option value="Investment" />
                )}
                {!isIncome && !categories.includes("Food") && (
                  <option value="Food" />
                )}
                {!isIncome && !categories.includes("Transportation") && (
                  <option value="Transportation" />
                )}
                {!isIncome && !categories.includes("Housing") && (
                  <option value="Housing" />
                )}
              </datalist>
              {errors.category && (
                <p className="text-destructive text-xs mt-1">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Account */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1" htmlFor="account_id">
              <div className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                Account
              </div>
            </label>
            <select
              id="account_id"
              className={`w-full px-3 py-2 border rounded-md ${errors.account_id ? 'border-destructive' : ''}`}
              {...register("account_id")}
            >
              <option value="">Select an account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({formatCurrency(Number(account.value))})
                </option>
              ))}
            </select>
            {errors.account_id && (
              <p className="text-destructive text-xs mt-1">{errors.account_id.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className={`w-full mint-button py-2 ${isSaving ? 'opacity-70' : ''}`}
            >
              {isSaving ? 'Saving...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
