"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '@/utils/auth-service';
import { ArrowLeft, DollarSign, Calendar, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatCurrency } from "@/utils/format";
import { Budget, Transaction } from "@/types/database";
import toast from 'react-hot-toast';

// Define form schema with Zod
const budgetSchema = z.object({
  category: z.string().min(2, "Category must be at least 2 characters"),
  budget_amount: z.coerce.number().min(1, "Budget amount must be at least 1"),
  start_date: z.string().nonempty("Start date is required"),
  end_date: z.string().nonempty("End date is required"),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

export default function EditBudgetPage({ params }: { params: { id: string } }) {
  // Get the budget ID from params
  const budgetId = params.id;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [categorySpending, setCategorySpending] = useState<Record<string, number>>({});
  const [budget, setBudget] = useState<Budget | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  // React Hook Form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: "",
      budget_amount: undefined,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
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

        // Fetch the budget to edit
        const { data: budgetData, error: budgetError } = await supabase
          .from('budgets')
          .select('*')
          .eq('id', budgetId)
          .single();
        
        if (budgetError) {
          console.error('Error fetching budget:', budgetError);
          setError('Budget not found. Please try again.');
          return;
        }
        
        setBudget(budgetData);
        
        // Set form values
        reset({
          category: budgetData.category,
          budget_amount: budgetData.budget_amount,
          start_date: budgetData.start_date ? new Date(budgetData.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          end_date: budgetData.end_date ? new Date(budgetData.end_date).toISOString().split('T')[0] : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
        });

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
  }, [params.id, router, reset]);

  const onSubmit = async (data: BudgetFormValues) => {
    try {
      setIsSaving(true);
      setError(null);
      
      const supabase = createClientComponentClient();
      
      // Get current user
      const { success, user } = await getCurrentUser();
      
      if (!success || !user) {
        setError('You must be signed in to update a budget.');
        return;
      }
      
      // Update budget in Supabase
      const { error: updateError } = await supabase
        .from('budgets')
        .update({
          category: data.category,
          budget_amount: data.budget_amount,
          start_date: data.start_date,
          end_date: data.end_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', budgetId);
      
      if (updateError) {
        throw updateError;
      }
      
      // Show success message
      toast.success('Budget updated successfully!');
      
      // Redirect to budgets page
      router.push('/dashboard/budgets');
      router.refresh();
    } catch (error) {
      console.error('Error updating budget:', error);
      setError('Failed to update budget. Please try again.');
      toast.error('Failed to update budget');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmation) {
      setDeleteConfirmation(true);
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const supabase = createClientComponentClient();
      
      // Delete the budget
      const { error: deleteError } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);
      
      if (deleteError) {
        throw deleteError;
      }
      
      toast.success('Budget deleted successfully');
      
      // Redirect to budgets page
      router.push('/dashboard/budgets');
      router.refresh();
    } catch (error) {
      console.error('Error deleting budget:', error);
      setError('Failed to delete budget. Please try again.');
      toast.error('Failed to delete budget');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/budgets" className="mint-button-icon">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">Edit Budget</h1>
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

  if (error && !budget) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/budgets" className="mint-button-icon">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">Edit Budget</h1>
        </div>
        <div className="mint-card p-8 text-center">
          <div className="text-destructive mb-2">{error}</div>
          <Link href="/dashboard/budgets" className="mint-button">
            Return to Budgets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/budgets" className="mint-button-icon">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Edit Budget</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="mint-card p-6">
          {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">{error}</div>}
          {success && <div className="mb-4 p-3 bg-primary/10 text-primary rounded-md">{success}</div>}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="category">
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Category
                </div>
              </label>
              <select
                id="category"
                className={`w-full px-3 py-2 border rounded-md ${errors.category ? 'border-destructive' : ''}`}
                {...register("category")}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-destructive text-xs mt-1">{errors.category.message}</p>
              )}
            </div>

            {/* Budget Amount */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="budget_amount">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Budget Amount
                </div>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5">$</span>
                <input
                  type="number"
                  id="budget_amount"
                  step="0.01"
                  min="0"
                  className={`w-full pl-7 pr-3 py-2 border rounded-md ${errors.budget_amount ? 'border-destructive' : ''}`}
                  placeholder="0.00"
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
                {isSaving ? 'Saving...' : 'Update Budget'}
              </button>
            </div>
          </form>

          {/* Delete Budget */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-medium mb-3">Delete Budget</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone. This will permanently delete the budget.
            </p>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`w-full py-2 border border-destructive text-destructive hover:bg-destructive/10 rounded-md transition-colors ${isDeleting ? 'opacity-70' : ''}`}
            >
              {deleteConfirmation 
                ? 'Click again to confirm deletion' 
                : isDeleting 
                  ? 'Deleting...' 
                  : 'Delete Budget'}
            </button>
          </div>
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
