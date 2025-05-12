"use client";

import { formatCurrency } from "../../../utils/format";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '../../../utils/auth-service';
import { Budget, Transaction } from '../../../types/database';

// Using the imported Budget type from database.ts

type BudgetWithProgress = Budget & {
  spent_amount: number;
  percentage: number;
  user_id: string; // Ensure user_id is included for TypeScript
};

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetWithProgress[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBudgets() {
      try {
        const supabase = createClientComponentClient();
        
        // Get user using auth-service
        const { success, user } = await getCurrentUser();
        
        if (!success || !user) {
          setIsLoading(false);
          return;
        }

        // Fetch budgets
        const { data: budgets } = await supabase
          .from('budgets')
          .select('id, category, budget_amount, start_date, end_date, created_at');
        
        // Fetch transactions for budget calculations
        const { data: transactions } = await supabase
          .from('transactions')
          .select('category, total')
          .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .lte('date', new Date().toISOString())
          .eq('type', 'expense'); // Using lowercase to match database values
        
        // Calculate spent amount for each budget
        const budgetsWithProgress = (budgets || []).map(budget => {
          const spent = (transactions || [])
            .filter(t => t.category === budget.category)
            .reduce((sum, t) => sum + Math.abs(t.total), 0);
          
          return {
            ...budget,
            spent_amount: spent,
            percentage: Math.round((spent / budget.budget_amount) * 100),
            user_id: user.id // Ensure user_id is included for TypeScript
          };
        });
        
        setBudgets(budgetsWithProgress);
        
        // Calculate totals
        const totalBudgetAmount = budgetsWithProgress.reduce((sum, b) => sum + b.budget_amount, 0);
        const totalSpentAmount = budgetsWithProgress.reduce((sum, b) => sum + b.spent_amount, 0);
        
        setTotalBudget(totalBudgetAmount);
        setTotalSpent(totalSpentAmount);
      } catch (error) {
        console.error('Error fetching budgets:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchBudgets();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Budgets</h1>
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <Link 
          href="/dashboard/budgets/add" 
          className="mint-button flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Budget
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="mint-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Budget</div>
          <div className="mt-1 text-2xl font-bold">{formatCurrency(totalBudget)}</div>
        </div>
        
        <div className="mint-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Spent</div>
          <div className="mt-1 text-2xl font-bold text-[hsl(var(--expense))]">{formatCurrency(totalSpent)}</div>
        </div>
        
        <div className="mint-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Remaining</div>
          <div className="mt-1 text-2xl font-bold text-[hsl(var(--income))]">{formatCurrency(totalBudget - totalSpent)}</div>
        </div>
      </div>

      {/* Budgets List */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Monthly Budgets</h2>
        
        {budgets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {budgets.map((budget) => (
              <div key={budget.id} className="mint-card p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{budget.category}</h3>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(budget.spent_amount)} of {formatCurrency(budget.budget_amount)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Link 
                      href={`/dashboard/budgets/edit/${budget.id}`} 
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Link>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {budget.percentage > 100 
                        ? 'Over budget!' 
                        : budget.percentage > 90 
                          ? 'Almost maxed!' 
                          : `${100 - budget.percentage}% remaining`}
                    </span>
                    <span>{budget.percentage}%</span>
                  </div>
                  <div className="mint-progress">
                    <div
                      className={`h-full rounded-full ${
                        budget.percentage > 90 
                          ? 'bg-[hsl(var(--expense))]' 
                          : budget.percentage > 75 
                            ? 'bg-amber-500' 
                            : 'bg-[hsl(var(--income))]'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mint-card p-8 text-center">
            <h3 className="text-lg font-medium">No budgets found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first budget to start tracking your spending.
            </p>
            <div className="mt-4">
              <Link 
                href="/dashboard/budgets/add" 
                className="mint-button inline-flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Add Budget
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
