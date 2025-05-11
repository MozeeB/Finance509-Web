import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { AccountBalances } from "@/components/dashboard/account-balances";
import { DebtOverview } from "@/components/dashboard/debt-overview";
import { EmergencyFund } from "@/components/dashboard/emergency-fund";
import { formatCurrency } from "../../utils/format";
import { ArrowUpDown, Wallet, PiggyBank, CreditCard, TrendingUp } from "lucide-react";
import { Account, Budget, Debt, Transaction } from "@/types/database";

export default async function FinanceDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch net worth data
  const { data: netWorthData } = await supabase
    .from('net_worth')
    .select('*')
    .single();

  // Fetch account data
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id);

  // Fetch account balances
  const { data: accountBalances } = await supabase
    .from('account_balances')
    .select('*');

  // Fetch recent transactions
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .limit(6);

  // Fetch budget data
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*');

  // Fetch transactions for budget calculations
  const { data: transactionsForBudget } = await supabase
    .from('transactions')
    .select('category, total')
    .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .lte('date', new Date().toISOString())
    .eq('type', 'Expense');

  // Calculate spent amount for each budget
  const budgetsWithProgress = budgets?.map((budget: Budget) => {
    const spent = transactionsForBudget
      ?.filter((t: Transaction) => t.category === budget.category)
      ?.reduce((sum: number, t: Transaction) => sum + Math.abs(t.total), 0) || 0;
    
    return {
      ...budget,
      spent_amount: spent,
      percentage: Math.round((spent / budget.budget_amount) * 100)
    };
  }) || [];

  // Fetch debt data
  const { data: debts } = await supabase
    .from('debts')
    .select('*');

  // Fetch emergency fund data
  const { data: emergencyFund } = await supabase
    .from('emergency_fund')
    .select('*')
    .single();

  // Calculate total income and expenses for the current month
  const { data: monthlyTransactions } = await supabase
    .from('transactions')
    .select('type, total')
    .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .lte('date', new Date().toISOString());

  const monthlyIncome = monthlyTransactions
    ?.filter((t: Transaction) => t.type === 'Income')
    ?.reduce((sum: number, t: Transaction) => sum + t.total, 0) || 0;

  const monthlyExpenses = monthlyTransactions
    ?.filter((t: Transaction) => t.type === 'Expense')
    ?.reduce((sum: number, t: Transaction) => sum + Math.abs(t.total), 0) || 0;

  return (
    <div className="flex-1 w-full flex flex-col gap-6 p-6 md:p-8" suppressHydrationWarning>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold">Finance Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back! Here's your financial overview for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 self-end">
          <div className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="mint-card group hover:border-primary/50 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="text-sm font-medium text-muted-foreground">Net Worth</div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(netWorthData?.net_worth || 0)}</div>
          <div className="text-xs text-muted-foreground mt-1">Total assets minus debts</div>
        </div>
        
        <div className="mint-card group hover:border-primary/50 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="text-sm font-medium text-muted-foreground">Total Assets</div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(netWorthData?.total_assets || 0)}</div>
          <div className="text-xs text-muted-foreground mt-1">Combined value of all accounts</div>
        </div>
        
        <div className="mint-card group hover:border-primary/50 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="text-sm font-medium text-muted-foreground">Total Debts</div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold">{formatCurrency(netWorthData?.total_debts || 0)}</div>
          <div className="text-xs text-muted-foreground mt-1">Combined value of all debts</div>
        </div>
        
        <div className="mint-card group hover:border-primary/50 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="text-sm font-medium text-muted-foreground">Monthly Cash Flow</div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ArrowUpDown className="h-4 w-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${monthlyIncome > monthlyExpenses ? 'income-text' : 'expense-text'}`}>
            {formatCurrency(monthlyIncome - monthlyExpenses)}
          </div>
          <div className="text-xs flex justify-between mt-1">
            <span className="text-[hsl(var(--income))]">Income: {formatCurrency(monthlyIncome)}</span>
            <span className="text-[hsl(var(--expense))]">Expenses: {formatCurrency(monthlyExpenses)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Emergency Fund */}
        {emergencyFund && (
          <div className="mint-card">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">Emergency Fund</h3>
              <div className="text-xs font-medium rounded-full px-2 py-1 bg-primary/10 text-primary">
                {Math.round((emergencyFund.current_amount / emergencyFund.goal_amount) * 100)}%
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="mint-progress">
                <div 
                  className="mint-progress-bar" 
                  style={{ width: `${Math.min(Math.round((emergencyFund.current_amount / emergencyFund.goal_amount) * 100), 100)}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="text-muted-foreground">Current</div>
                  <div className="font-medium">{formatCurrency(emergencyFund.current_amount)}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">Goal</div>
                  <div className="font-medium">{formatCurrency(emergencyFund.goal_amount)}</div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Target: {emergencyFund.target_months} months of expenses
              </div>
            </div>
          </div>
        )}

        {/* Account Balances */}
        <div className="mint-card md:col-span-2">
          <h3 className="text-lg font-medium mb-4">Account Balances</h3>
          <div className="space-y-4">
            {accounts?.map((account: Account) => {
              const balance = accountBalances?.find((ab: any) => ab.account_id === account.id);
              return (
                <div key={account.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium">{account.name}</div>
                    <div className="text-xs text-muted-foreground">{account.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(account.value)}</div>
                    {balance?.transaction_total !== 0 && (
                      <div className={`text-xs ${balance?.transaction_total > 0 ? 'income-text' : 'expense-text'}`}>
                        {balance?.transaction_total > 0 ? '+' : ''}{formatCurrency(balance?.transaction_total || 0)} this month
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Budget Progress */}
        <div className="mint-card md:col-span-2">
          <h3 className="text-lg font-medium mb-4">Budget Progress</h3>
          <div className="space-y-5">
            {budgetsWithProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">No budgets found.</p>
            ) : (
              budgetsWithProgress.slice(0, 3).map((budget: Budget & { spent_amount: number; percentage: number }) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{budget.category}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(budget.spent_amount)} of {formatCurrency(budget.budget_amount)}
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${budget.percentage > 90 ? 'expense-text' : budget.percentage > 75 ? 'text-amber-500' : 'income-text'}`}>
                      {budget.percentage}%
                    </div>
                  </div>
                  <div className="mint-progress">
                    <div
                      className={`h-full rounded-full ${budget.percentage > 90 ? 'bg-[hsl(var(--expense))]' : budget.percentage > 75 ? 'bg-amber-500' : 'bg-[hsl(var(--income))]'}`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Debt Overview */}
        <div className="mint-card">
          <h3 className="text-lg font-medium mb-4">Debt Overview</h3>
          <div className="space-y-4">
            {!debts || debts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No debts found.</p>
            ) : (
              debts.map((debt: Debt) => (
                <div key={debt.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium">{debt.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {debt.interest_rate}% • {debt.strategy}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(debt.amount)}</div>
                    <div className="text-xs" suppressHydrationWarning>
                      Due: {new Date(debt.due_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mint-card col-span-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Recent Transactions</h3>
            <a href="/protected/transactions" className="text-sm text-primary hover:underline">View all</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground text-sm">Date</th>
                  <th className="text-left py-2 font-medium text-muted-foreground text-sm">Description</th>
                  <th className="text-left py-2 font-medium text-muted-foreground text-sm">Category</th>
                  <th className="text-right py-2 font-medium text-muted-foreground text-sm">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground text-sm">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  recentTransactions?.map((transaction: Transaction) => (
                    <tr key={transaction.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 text-sm">{new Date(transaction.date).toLocaleDateString()}</td>
                      <td className="py-3 text-sm font-medium">{transaction.description}</td>
                      <td className="py-3 text-sm">
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-secondary">
                          {transaction.category}
                        </span>
                      </td>
                      <td className={`py-3 text-sm font-medium text-right ${transaction.type === 'Income' ? 'income-text' : 'expense-text'}`}>
                        {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.total))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
