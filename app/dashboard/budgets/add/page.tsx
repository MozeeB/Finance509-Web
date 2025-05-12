"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '../../../../utils/auth-service';
import { ArrowLeft, DollarSign, Calendar, Tag } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatCurrency } from "../../../../utils/format";
import { Transaction } from "../../../../types/database";

// Define form schema with Zod
const budgetSchema = z.object({
  category: z.string().min(2, "Category must be at least 2 characters"),
  budget_amount: z.coerce.number().min(1, "Budget amount must be at least 1"),
  start_date: z.string().nonempty("Start date is required"),
  end_date: z.string().nonempty("End date is required"),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

export default function AddBudgetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [categorySpending, setCategorySpending] = useState<Record<string, number>>({});

  // React Hook Form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
      budget_amount: undefined,
    },
  });

  // Watch the category to show spending insights
  const selectedCategory = watch("category");

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

        // Fetch existing categories from transactions
        const { data: transactionsData } = await supabase
          .from('transactions')
          .select('category, total, type, date')
          .eq('user_id', user.id)
          .eq('type', 'Expense');
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set((transactionsData || []).map(t => t.category))
        ).filter(Boolean);
        
        setCategories(uniqueCategories);

        // Calculate average spending per category over the last 3 months
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        
        const recentTransactions = (transactionsData || []).filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= threeMonthsAgo && transactionDate <= now;
        });
        
        const spendingByCategory: Record<string, number> = {};
        
        uniqueCategories.forEach(category => {
          const categoryTransactions = recentTransactions.filter(t => t.category === category);
          const totalSpent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.total), 0);
          const averageMonthlySpent = totalSpent / 3; // Average over 3 months
          
          spendingByCategory[category] = averageMonthlySpent;
        });
        
        setCategorySpending(spendingByCategory);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [router]);

  const onSubmit = async (data: BudgetFormValues) => {
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
      
      // Create budget
      const { error: budgetError } = await supabase
        .from('budgets')
        .insert({
          category: data.category,
          budget_amount: data.budget_amount,
          start_date: data.start_date,
          end_date: data.end_date,
          created_at: new Date().toISOString(),
        });
      
      if (budgetError) throw budgetError;
      
      setSuccess('Budget added successfully!');
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/dashboard/budgets');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving budget:', error);
      setError(error.message || 'Failed to save budget. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/budgets" className="rounded-md p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Add Budget</h1>
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
      <div className="flex items-center gap-2">
        <Link href="/dashboard/budgets" className="rounded-md p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Add Budget</h1>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-800 p-4 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="mint-card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Category */}
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
                placeholder="e.g., Groceries, Dining, Transportation"
                className={`w-full px-3 py-2 border rounded-md ${errors.category ? 'border-destructive' : ''}`}
                {...register("category")}
              />
              <datalist id="category-options">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
                {!categories.includes("Groceries") && <option value="Groceries" />}
                {!categories.includes("Dining") && <option value="Dining" />}
                {!categories.includes("Transportation") && <option value="Transportation" />}
                {!categories.includes("Housing") && <option value="Housing" />}
                {!categories.includes("Utilities") && <option value="Utilities" />}
                {!categories.includes("Entertainment") && <option value="Entertainment" />}
              </datalist>
              {errors.category && (
                <p className="text-destructive text-xs mt-1">{errors.category.message}</p>
              )}
            </div>

            {/* Budget Amount */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="budget_amount">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Monthly Budget Amount
                </div>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <input
                  type="number"
                  id="budget_amount"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  className={`w-full pl-7 px-3 py-2 border rounded-md ${errors.budget_amount ? 'border-destructive' : ''}`}
                  {...register("budget_amount")}
                />
              </div>
              {errors.budget_amount && (
                <p className="text-destructive text-xs mt-1">{errors.budget_amount.message}</p>
              )}
              
              {selectedCategory && categorySpending[selectedCategory] > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Your average monthly spending for {selectedCategory} is {formatCurrency(categorySpending[selectedCategory])}
                </p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid gap-4 grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="start_date">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </div>
                </label>
                <input
                  type="date"
                  id="start_date"
                  className={`w-full px-3 py-2 border rounded-md ${errors.start_date ? 'border-destructive' : ''}`}
                  {...register("start_date")}
                />
                {errors.start_date && (
                  <p className="text-destructive text-xs mt-1">{errors.start_date.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="end_date">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    End Date
                  </div>
                </label>
                <input
                  type="date"
                  id="end_date"
                  className={`w-full px-3 py-2 border rounded-md ${errors.end_date ? 'border-destructive' : ''}`}
                  {...register("end_date")}
                />
                {errors.end_date && (
                  <p className="text-destructive text-xs mt-1">{errors.end_date.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className={`w-full mint-button py-2 ${isSaving ? 'opacity-70' : ''}`}
              >
                {isSaving ? 'Saving...' : 'Create Budget'}
              </button>
            </div>
          </form>
        </div>

        <div className="mint-card p-6">
          <h2 className="text-lg font-medium mb-4">Budget Tips</h2>
          
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-primary/10 rounded-lg">
              <h3 className="font-medium mb-1">50/30/20 Rule</h3>
              <p>Allocate 50% of your income to needs, 30% to wants, and 20% to savings and debt repayment.</p>
            </div>
            
            <div className="p-3 bg-primary/10 rounded-lg">
              <h3 className="font-medium mb-1">Zero-Based Budgeting</h3>
              <p>Assign every dollar a job so your income minus expenses equals zero.</p>
            </div>
            
            <div className="p-3 bg-primary/10 rounded-lg">
              <h3 className="font-medium mb-1">Common Budget Categories</h3>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Housing: Rent/mortgage, insurance, property tax</li>
                <li>Utilities: Electricity, water, gas, internet</li>
                <li>Food: Groceries, dining out</li>
                <li>Transportation: Gas, car payment, public transit</li>
                <li>Health: Insurance, medications, gym membership</li>
                <li>Entertainment: Streaming services, hobbies, events</li>
                <li>Personal: Clothing, haircuts, personal care</li>
                <li>Savings: Emergency fund, retirement, goals</li>
                <li>Debt: Credit cards, student loans, personal loans</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
