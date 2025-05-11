import { createClient } from "@/utils/supabase/server";
import { formatCurrency } from "@/utils/format";
import Link from "next/link";
import { Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function EmergencyFundPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch emergency fund data
  const { data: emergencyFund } = await supabase
    .from('emergency_fund')
    .select('*')
    .single();

  // Calculate monthly expenses (could be from budget totals or other sources)
  const { data: budgets } = await supabase
    .from('budgets')
    .select('budget_amount');
    
  const monthlyExpenses = budgets?.reduce((sum, budget) => sum + budget.budget_amount, 0) || 0;
  
  // Calculate metrics
  const fundExists = emergencyFund !== null;
  const goalAmount = fundExists ? emergencyFund.goal_amount : 0;
  const currentAmount = fundExists ? emergencyFund.current_amount : 0;
  const targetMonths = fundExists ? emergencyFund.target_months : 0;
  const percentage = goalAmount > 0 ? Math.round((currentAmount / goalAmount) * 100) : 0;
  const monthsCovered = monthlyExpenses > 0 ? Math.round((currentAmount / monthlyExpenses) * 10) / 10 : 0;
  const remaining = goalAmount - currentAmount;

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold">Emergency Fund</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build your financial safety net for unexpected expenses
          </p>
        </div>
        <Link 
          href="/protected/emergency-fund/edit" 
          className="mint-button flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          {fundExists ? "Edit" : "Set Up"} Emergency Fund
        </Link>
      </div>

      {!fundExists ? (
        <div className="mint-card text-center py-16">
          <div className="flex flex-col items-center max-w-md mx-auto gap-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Edit className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">No Emergency Fund Set Up</h2>
              <p className="text-muted-foreground mb-6">
                An emergency fund is an important financial safety net. It's recommended to have 3-6 months of expenses saved.
              </p>
              <Link href="/protected/emergency-fund/edit">
                <button className="mint-button">Set Up Your Emergency Fund</button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="mint-card">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Emergency Fund Progress</h2>
                <div className="text-sm text-muted-foreground">
                  Goal: {targetMonths} months of expenses ({formatCurrency(goalAmount)})
                </div>
              </div>
              
              <div className="mint-progress mb-6">
                <div
                  className={`mint-progress-bar ${
                    percentage < 25
                      ? "bg-[hsl(var(--expense))]"
                      : percentage < 50
                      ? "bg-amber-500"
                      : percentage < 75
                      ? "bg-yellow-500"
                      : "bg-[hsl(var(--income))]"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="mint-card bg-secondary/30 p-6 text-center">
                  <div className="text-sm text-muted-foreground mb-1">Current Amount</div>
                  <div className="text-2xl font-bold income-text">{formatCurrency(currentAmount)}</div>
                </div>
                
                <div className="mint-card bg-secondary/30 p-6 text-center">
                  <div className="text-sm text-muted-foreground mb-1">Progress</div>
                  <div className="text-2xl font-bold">
                    <span className={`${percentage < 50 ? 'expense-text' : 'income-text'}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
                
                <div className="mint-card bg-secondary/30 p-6 text-center">
                  <div className="text-sm text-muted-foreground mb-1">Remaining</div>
                  <div className="text-2xl font-bold expense-text">{formatCurrency(remaining)}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="mint-card p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Current Coverage</h3>
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                  <span className="text-xs font-bold">{monthsCovered}</span>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold">{monthsCovered}</div>
                <div className="text-sm text-muted-foreground">Months of Expenses</div>
              </div>
              <div className="mint-progress mt-4">
                <div
                  className="mint-progress-bar bg-blue-500"
                  style={{ width: `${Math.min((monthsCovered / targetMonths) * 100, 100)}%` }}
                />
              </div>
            </div>
            
            <div className="mint-card p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Monthly Expenses</h3>
                <div className="h-8 w-8 rounded-full bg-[hsl(var(--expense))/10] text-[hsl(var(--expense))] flex items-center justify-center">
                  <span className="text-xs font-bold">$</span>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold expense-text">{formatCurrency(monthlyExpenses)}</div>
                <div className="text-sm text-muted-foreground">From Budgets</div>
              </div>
              <div className="text-xs text-muted-foreground mt-4">
                Based on your current monthly budget allocations
              </div>
            </div>
            
            <div className="mint-card p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Target Savings</h3>
                <div className="h-8 w-8 rounded-full bg-[hsl(var(--income))/10] text-[hsl(var(--income))] flex items-center justify-center">
                  <span className="text-xs font-bold">{targetMonths}</span>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold">{targetMonths}</div>
                <div className="text-sm text-muted-foreground">Months of Expenses</div>
              </div>
              <div className="text-xs text-muted-foreground mt-4">
                Recommended: 3-6 months for financial security
              </div>
            </div>
          </div>
          
          {emergencyFund.notes && (
            <div className="mint-card">
              <h3 className="text-lg font-medium mb-4">Notes</h3>
              <div className="bg-secondary/30 p-4 rounded-lg text-sm">
                {emergencyFund.notes}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
