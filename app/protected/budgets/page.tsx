import { createClient } from "@/utils/supabase/server";
import { formatCurrency } from "@/utils/format";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default async function BudgetsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch budgets
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*')
    .order('category', { ascending: true });

  // Fetch transactions to calculate spent amounts
  const { data: transactions } = await supabase
    .from('transactions')
    .select('category, total')
    .eq('type', 'Expense')
    .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .lte('date', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString());

  // Calculate spent amount for each budget category
  const budgetsWithSpent = budgets?.map(budget => {
    const spent = transactions
      ?.filter(t => t.category === budget.category)
      .reduce((sum, t) => sum + Math.abs(t.total), 0) || 0;
    
    return {
      ...budget,
      spent_amount: spent,
      percentage: Math.round((spent / budget.budget_amount) * 100)
    };
  });

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage your spending limits by category
          </p>
        </div>
        <Link 
          href="/protected/budgets/add" 
          className="mint-button flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Budget
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgetsWithSpent && budgetsWithSpent.length > 0 ? (
          budgetsWithSpent.map((budget) => (
            <div 
              key={budget.id} 
              className="mint-card group hover:border-primary/50 transition-all"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">{budget.category}</h3>
                <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${
                  budget.percentage > 90 
                    ? 'bg-[hsl(var(--expense))/10] text-[hsl(var(--expense))]' 
                    : budget.percentage > 75 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-[hsl(var(--income))/10] text-[hsl(var(--income))]'
                }`}>
                  {budget.percentage}%
                </span>
              </div>
              
              <div className="mint-progress mb-4">
                <div
                  className={`mint-progress-bar ${
                    budget.percentage > 90
                      ? "bg-[hsl(var(--expense))]"
                      : budget.percentage > 75
                      ? "bg-amber-500"
                      : "bg-[hsl(var(--income))]"
                  }`}
                  style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Spent</div>
                  <div className="font-medium">{formatCurrency(budget.spent_amount)}</div>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Budget</div>
                  <div className="font-medium">{formatCurrency(budget.budget_amount)}</div>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Remaining</div>
                  <div className={`font-medium ${budget.budget_amount - budget.spent_amount < 0 ? "expense-text" : "income-text"}`}>
                    {formatCurrency(budget.budget_amount - budget.spent_amount)}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <div>
                  <span className="inline-flex items-center rounded-full px-2 py-1 bg-secondary">
                    {new Date(budget.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {' '}-{' '}
                  <span className="inline-flex items-center rounded-full px-2 py-1 bg-secondary">
                    {new Date(budget.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <Link 
                  href={`/protected/budgets/${budget.id}`} 
                  className="text-primary hover:underline"
                >
                  Details
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="mint-card col-span-full text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <PlusCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">No budgets found</h3>
                <p className="text-muted-foreground mb-4">Create your first budget to start tracking your spending</p>
                <Link 
                  href="/protected/budgets/add" 
                  className="mint-button inline-flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Budget
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
