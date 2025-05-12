"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '../../../../../utils/auth-service';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from 'react-hot-toast';
import { Trash2, DollarSign, Calendar, Tag } from "lucide-react";
import { formatCurrency } from "../../../../../utils/format";
import { Budget } from "../../../../../types/database";

// Form schema
const budgetSchema = z.object({
  category: z.string().min(1, { message: "Category is required" }),
  budget_amount: z.coerce.number().min(1, { message: "Budget amount must be greater than 0" }),
  start_date: z.string().min(1, { message: "Start date is required" }),
  end_date: z.string().min(1, { message: "End date is required" }),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

interface EditBudgetFormProps {
  budgetId: string;
  initialBudget: Budget;
  categories: string[];
}

export default function EditBudgetForm({ budgetId, initialBudget, categories }: EditBudgetFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categorySpending, setCategorySpending] = useState<Record<string, number>>({});
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  // React Hook Form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: initialBudget.category || "",
      budget_amount: initialBudget.budget_amount || 0,
      start_date: initialBudget.start_date 
        ? new Date(initialBudget.start_date).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      end_date: initialBudget.end_date 
        ? new Date(initialBudget.end_date).toISOString().split('T')[0] 
        : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    },
  });

  // Watch the category to show spending insights
  const selectedCategory = watch("category");

  // Handle form submission
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
      
      console.log('Updating budget with ID:', budgetId);
      console.log('Budget data:', data);
      
      // First check if the budget exists
      const { data: existingBudget, error: checkError } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', budgetId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking budget:', checkError);
        throw checkError;
      }
      
      if (!existingBudget) {
        console.error('Budget not found with ID:', budgetId);
        throw new Error('Budget not found. It may have been deleted.');
      }
      
      // Update budget in Supabase
      const updateData = {
        category: data.category,
        budget_amount: data.budget_amount,
        start_date: data.start_date,
        end_date: data.end_date,
      };
      
      console.log('Update data:', updateData);
      
      const { error: updateError } = await supabase
        .from('budgets')
        .update(updateData)
        .eq('id', budgetId);
      
      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw updateError;
      }
      
      // Show success message
      toast.success('Budget updated successfully!');
      
      // Redirect to budgets page
      router.push('/dashboard/budgets');
      router.refresh();
    } catch (error: any) {
      // More detailed error logging
      console.error('Error updating budget:', error);
      console.error('Error details:', error?.message, error?.details, error?.hint);
      
      // Show more specific error message if available
      const errorMessage = error?.message || 'Failed to update budget. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle budget deletion
  const handleDelete = async () => {
    // First click sets confirmation, second click deletes
    if (!deleteConfirmation) {
      setDeleteConfirmation(true);
      // Reset confirmation after 5 seconds
      setTimeout(() => setDeleteConfirmation(false), 5000);
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
      
      if (deleteError) throw deleteError;
      
      toast.success('Budget deleted successfully!');
      
      // Redirect to budgets page
      router.push('/dashboard/budgets');
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      setError('Failed to delete budget. Please try again.');
      toast.error('Failed to delete budget');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation(false);
    }
  };

  return (
    <div className="mint-card p-6">
      <h2 className="text-lg font-medium mb-4">Budget Details</h2>
      
      {error && (
        <div className="p-4 mb-6 bg-destructive/10 border border-destructive text-destructive rounded-md">
          {error}
        </div>
      )}
      
      {/* Budget Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
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
            
            {/* Spending Insights */}
            {selectedCategory && categorySpending[selectedCategory] && (
              <div className="mt-2 text-xs text-muted-foreground">
                <p>Average monthly spending: {formatCurrency(categorySpending[selectedCategory])}</p>
              </div>
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
            <input
              type="number"
              id="budget_amount"
              step="0.01"
              min="0"
              placeholder="0.00"
              className={`w-full px-3 py-2 border rounded-md ${errors.budget_amount ? 'border-destructive' : ''}`}
              {...register("budget_amount")}
            />
            {errors.budget_amount && (
              <p className="text-destructive text-xs mt-1">{errors.budget_amount.message}</p>
            )}
          </div>
          
          {/* Date Range */}
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
        <div className="pt-4 mt-2">
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
  );
}
