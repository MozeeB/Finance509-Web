"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/format";
import { PlusCircle, ArrowUpRight, ArrowDownRight, CreditCard, Wallet, PiggyBank, BarChart3, Calendar, TrendingUp, PieChart } from "lucide-react";
import Link from "next/link";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '@/utils/auth-service';
import { Account, Transaction, Debt, Budget, EmergencyFund } from '@/types/database';
import { MonthlyTrendChart, MonthlyChartData } from '@/components/dashboard/charts/monthly-trend-chart';
import { ExpenseCategoriesChart, CategoryData } from '@/components/dashboard/charts/expense-categories-chart';

// Define additional types for dashboard display
type BudgetWithProgress = Budget & {
  spent_amount: number;
  percentage: number;
};

type MonthlyData = {
  month: string;
  income: number;
  expenses: number;
  savings: number;
};

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  
  // Financial summary data
  const [netWorth, setNetWorth] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0); // Add state for total debt
  const [liabilitiesFromAccounts, setLiabilitiesFromAccounts] = useState(0); // Track negative accounts separately
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [savingsRate, setSavingsRate] = useState(0);
  const [debtToIncomeRatio, setDebtToIncomeRatio] = useState(0); // New metric
  const [estimatedPayoffDate, setEstimatedPayoffDate] = useState<Date | null>(null); // New metric
  const [budgetProgress, setBudgetProgress] = useState<BudgetWithProgress[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyChartData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        const supabase = createClientComponentClient();
        
        // Get user using auth-service
        const { success, user } = await getCurrentUser();
        
        if (!success || !user) {
          setIsLoading(false);
          return;
        }

        // Fetch accounts
        const { data: accountsData } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user.id);
        
        setAccounts(accountsData || []);
        
        // Calculate assets and liabilities from accounts
        const assets = (accountsData || []).filter(a => Number(a.value) > 0).reduce((sum, a) => sum + Number(a.value), 0);
        const negativeAccounts = (accountsData || []).filter(a => Number(a.value) < 0).reduce((sum, a) => sum + Math.abs(Number(a.value)), 0);
        
        // Store assets and liabilities from accounts values
        setTotalAssets(assets);
        setLiabilitiesFromAccounts(negativeAccounts);
        
        // Note: We'll update total liabilities and net worth after fetching debts later in the code

        // Get transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });
        
        console.log('Transactions Data:', transactionsData);
        console.log('Transactions Error:', transactionsError);
        
        if (transactionsData) {
          // Ensure all transaction data is properly formatted
          const formattedTransactions = transactionsData.map(transaction => ({
            ...transaction,
            total: Number(transaction.total),
            date: transaction.date || new Date().toISOString().split('T')[0]
          }));
          setTransactions(formattedTransactions);
        } else {
          setTransactions([]);
        }
        
        // Get current month for filtering
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        
        // Filter transactions for current month client-side
        const currentMonthTransactions = (transactionsData || []).filter(t => 
          t.date && t.date.startsWith(currentMonth)
        );
        
        // Get monthly data for the last 6 months for trends
        const last6Months = [];
        for (let i = 0; i < 6; i++) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
          last6Months.push(monthStr);
        }
        
        const monthlyDataPoints = last6Months.map((month, index) => {
          const monthTransactions = (transactionsData || []).filter(t => 
            t.date && t.date.startsWith(month)
          );
          
          const monthIncome = monthTransactions
            .filter(t => t.type.toLowerCase() === 'income')
            .reduce((sum, t) => sum + Math.abs(Number(t.total)), 0);
            
          const monthExpenses = monthTransactions
            .filter(t => t.type.toLowerCase() === 'expense')
            .reduce((sum, t) => sum + Math.abs(Number(t.total)), 0);
            
          // Format the month label properly
          const monthDate = new Date(month + '-01');
          const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short' });
            
          return {
            month: monthLabel,
            income: monthIncome,
            expenses: monthExpenses,
            savings: monthIncome - monthExpenses
          };
        });
        
        // Reverse to get chronological order
        setMonthlyData(monthlyDataPoints.reverse());
        
        // Calculate monthly income and expenses
        const monthlyIncomeTotal = currentMonthTransactions
          .filter(t => t.type.toLowerCase() === 'income')
          .reduce((sum, t) => sum + Math.abs(Number(t.total)), 0);
          
        const monthlyExpensesTotal = currentMonthTransactions
          .filter(t => t.type.toLowerCase() === 'expense')
          .reduce((sum, t) => sum + Math.abs(Number(t.total)), 0);
        
        setMonthlyIncome(monthlyIncomeTotal);
        setMonthlyExpenses(monthlyExpensesTotal);
        
        // Calculate savings rate
        const savingsRateValue = monthlyIncomeTotal > 0 ? Math.round(((monthlyIncomeTotal - monthlyExpensesTotal) / monthlyIncomeTotal) * 100) : 0;
        setSavingsRate(savingsRateValue);
        
        // Calculate expense categories data for chart
        const expensesByCategory: Record<string, number> = {};
        
        // Group expenses by category
        currentMonthTransactions
          .filter(t => t.type.toLowerCase() === 'expense')
          .forEach(transaction => {
            const category = transaction.category || 'Uncategorized';
            if (!expensesByCategory[category]) {
              expensesByCategory[category] = 0;
            }
            expensesByCategory[category] += Math.abs(Number(transaction.total));
          });
        
        // Convert to array format for chart
        const categoryDataArray = Object.entries(expensesByCategory)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount); // Sort by amount descending
        
        setCategoryData(categoryDataArray);

        // Fetch emergency fund records
        const { data: emergencyFundData } = await supabase
          .from('emergency_fund')
          .select('*')
          .order('created_at', { ascending: false });
        
        console.log('Emergency Fund Data:', emergencyFundData);
        // Use the most recent emergency fund record if available
        if (emergencyFundData && emergencyFundData.length > 0) {
          setEmergencyFund(emergencyFundData[0]);
        } else {
          setEmergencyFund(null);
        }

        // Fetch debts
        const { data: debtsData } = await supabase
          .from('debts')
          .select('*');
          // Note: No user_id filter as the column doesn't exist in the debts table
        
        // Map debts to match our component needs
        const mappedDebts = (debtsData || []).map(debt => ({
          ...debt,
          minimum_payment: debt.min_payment || 0, // Map min_payment to minimum_payment for UI consistency
        }));
        
        setDebts(mappedDebts);
        
        // Calculate total debt amount
        const debtAmount = (debtsData || []).reduce((sum, debt) => sum + Number(debt.amount), 0);
        setTotalDebt(debtAmount);
        
        // Calculate total monthly debt payments
        const monthlyDebtPayments = (debtsData || []).reduce((sum, debt) => sum + Number(debt.min_payment || 0), 0);
        
        // Now calculate total liabilities (negative accounts + debts)
        const totalLiabilitiesAmount = negativeAccounts + debtAmount;
        setTotalLiabilities(totalLiabilitiesAmount);
        
        // Update net worth calculation
        setNetWorth(assets - totalLiabilitiesAmount);
        
        // Calculate debt-to-income ratio (monthly debt payments / monthly income)
        // A healthy DTI ratio is typically below 36%
        if (monthlyIncome > 0) {
          const dti = (monthlyDebtPayments / monthlyIncome) * 100;
          setDebtToIncomeRatio(dti);
        }
        
        // Estimate debt payoff date (simplified calculation)
        if (debtsData && debtsData.length > 0 && monthlyDebtPayments > 0) {
          // Simple estimation assuming constant payments and no additional interest accrual
          const averageInterestRate = (debtsData || []).reduce((sum, debt) => sum + Number(debt.interest_rate || 0), 0) / debtsData.length / 100 / 12;
          const monthsToPayoff = Math.log(1 / (1 - (debtAmount * averageInterestRate / monthlyDebtPayments))) / Math.log(1 + averageInterestRate);
          
          // Handle edge cases and ensure reasonable result
          const finalMonths = isNaN(monthsToPayoff) || !isFinite(monthsToPayoff) || monthsToPayoff < 0 
            ? debtAmount / monthlyDebtPayments  // Fallback to simple division if complex formula fails
            : monthsToPayoff;
            
          const payoffDate = new Date();
          payoffDate.setMonth(payoffDate.getMonth() + Math.ceil(finalMonths));
          setEstimatedPayoffDate(payoffDate);
        } else {
          setEstimatedPayoffDate(null);
        }

        // Fetch budgets and calculate progress
        const { data: budgetsData } = await supabase
          .from('budgets')
          .select('*');
        
        // Calculate budget progress - only use current month transactions
        const budgetsWithProgress = (budgetsData || []).map(budget => {
          const spentAmount = currentMonthTransactions
            .filter(t => t.type.toLowerCase() === 'expense' && t.category === budget.category)
            .reduce((sum, t) => sum + Math.abs(Number(t.total)), 0);
          
          const percentage = Number(budget.budget_amount) > 0 
            ? Math.round((spentAmount / Number(budget.budget_amount)) * 100) 
            : 0;
          
          return {
            ...budget,
            spent_amount: spentAmount,
            percentage
          };
        });
        
        // Sort budgets by percentage (highest first) for better visibility
        budgetsWithProgress.sort((a, b) => b.percentage - a.percentage);
        
        setBudgets(budgetsData || []);
        setBudgetProgress(budgetsWithProgress);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError(error?.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mint-card p-6">
              <div className="animate-pulse">
                <div className="h-8 w-24 bg-primary/10 rounded mb-2"></div>
                <div className="h-4 w-48 bg-primary/10 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">
          <p className="font-medium">Error loading dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">

        {/* Net Worth */}
        <div className="mint-card p-6">
          <h2 className="text-lg font-semibold mb-4">Net Worth</h2>
          <div className="text-3xl font-bold mb-2">{formatCurrency(netWorth)}</div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Assets</div>
              <div className="text-xl font-bold text-[hsl(var(--income))]">{formatCurrency(totalAssets)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Liabilities</div>
              <div className="text-xl font-bold text-[hsl(var(--expense))]">{formatCurrency(totalLiabilities)}</div>
            </div>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="mint-card p-6">
          <h2 className="text-lg font-semibold mb-4">This Month</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Income</div>
              <div className="flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4 text-[hsl(var(--income))]" />
                <div className="text-xl font-bold">{formatCurrency(monthlyIncome)}</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Expenses</div>
              <div className="flex items-center gap-1">
                <ArrowDownRight className="h-4 w-4 text-[hsl(var(--expense))]" />
                <div className="text-xl font-bold">{formatCurrency(monthlyExpenses)}</div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium text-muted-foreground">Savings Rate</div>
            <div className="text-xl font-bold">{savingsRate}%</div>
          </div>
          <div className="mt-6 pt-5 border-t">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-base font-medium">Monthly Trend</div>
                <p className="text-xs text-muted-foreground mt-1">Income, expenses and savings over time</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </div>
            {monthlyData.length > 0 ? (
              <div className="mt-2">
                <MonthlyTrendChart data={monthlyData} />
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-sm bg-secondary rounded-2xl mt-2">
                <TrendingUp className="h-8 w-8 text-primary/30 mb-2" />
                <p>No data available for the last 6 months</p>
                <p className="text-xs mt-1">Add transactions to see your financial trends</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense Categories Chart */}
      <div className="mint-card mint-card-hover p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Expense Categories</h2>
            <p className="text-sm text-muted-foreground mt-1">Where your money went this month</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
            <PieChart className="h-5 w-5 text-primary" />
          </div>
        </div>
        {categoryData.length > 0 ? (
          <div className="mt-4">
            <ExpenseCategoriesChart data={categoryData} />
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm bg-secondary rounded-2xl">
            <PieChart className="h-10 w-10 text-primary/30 mb-3" />
            <p>No expense data available for this month</p>
            <p className="text-xs mt-1">Add transactions to see your spending breakdown</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Transactions */}
        <div className="mint-card p-6 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <Link 
              href="/dashboard/transactions" 
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>No transactions found.</p>
                <Link 
                  href="/dashboard/transactions/add" 
                  className="text-primary hover:underline text-sm mt-2 inline-block"
                >
                  Add your first transaction
                </Link>
              </div>
            ) : (
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
                  {transactions.slice(0, 5).map((transaction, index) => (
                    <tr key={transaction.id || index} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 text-sm">{transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}</td>
                      <td className="py-3 text-sm font-medium">{transaction.description || 'Unnamed Transaction'}</td>
                      <td className="py-3 text-sm">
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-secondary">
                          {transaction.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className={`py-3 text-sm font-medium text-right ${transaction.type.toLowerCase() === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {transaction.type.toLowerCase() === 'income' ? '+' : '-'} {formatCurrency(Math.abs(Number(transaction.total || 0)))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Budget Progress */}
        <div className="mint-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Budget Progress</h2>
            <Link 
              href="/dashboard/budgets" 
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {budgetProgress.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>No budgets found.</p>
                <Link 
                  href="/dashboard/budgets/add" 
                  className="text-primary hover:underline text-sm mt-2 inline-block"
                >
                  Add your first budget
                </Link>
              </div>
            ) : (
              budgetProgress.slice(0, 5).map((budgetItem) => (
                <div key={budgetItem.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="font-medium">{budgetItem.category}</div>
                    <div className="text-muted-foreground">
                      {formatCurrency(budgetItem.spent_amount)} / {formatCurrency(Number(budgetItem.budget_amount))}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <div>
                      {budgetItem.percentage > 100 ? 'Over budget' : `${100 - budgetItem.percentage}% remaining`}
                    </div>
                    <div>
                      {budgetItem.percentage}%
                    </div>
                  </div>
                  <div className="mint-progress">
                    <div
                      className={`h-full rounded-full ${budgetItem.percentage > 90 ? 'bg-[hsl(var(--expense))]' : budgetItem.percentage > 75 ? 'bg-amber-500' : 'bg-[hsl(var(--income))]'}`}
                      style={{ width: `${Math.min(budgetItem.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Debt Insights Section */}
      <div className="mint-card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Debt Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-l-primary">
            <div className="text-sm font-medium text-muted-foreground">Total Debt</div>
            <div className="text-xl font-bold text-[hsl(var(--expense))]">{formatCurrency(totalDebt)}</div>
            <div className="text-xs text-muted-foreground mt-1 flex justify-between">
              <span>Credit Cards: {formatCurrency(liabilitiesFromAccounts)}</span>
              <span>Loans: {formatCurrency(totalDebt - liabilitiesFromAccounts)}</span>
            </div>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-l-primary">
            <div className="text-sm font-medium text-muted-foreground">Debt-to-Income Ratio</div>
            <div className="text-xl font-bold">
              {debtToIncomeRatio.toFixed(1)}%
              <span className="text-xs ml-2 font-normal">
                {debtToIncomeRatio <= 36 ? '(Healthy)' : debtToIncomeRatio <= 43 ? '(Moderate)' : '(High)'}
              </span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${debtToIncomeRatio <= 36 ? 'bg-[hsl(var(--income))]' : debtToIncomeRatio <= 43 ? 'bg-amber-500' : 'bg-[hsl(var(--expense))]'}`}
                style={{ width: `${Math.min(debtToIncomeRatio, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-l-primary">
            <div className="text-sm font-medium text-muted-foreground">Est. Debt Payoff</div>
            <div className="text-xl font-bold">
              {estimatedPayoffDate 
                ? estimatedPayoffDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
                : 'N/A'}
            </div>
            {estimatedPayoffDate && (
              <div className="text-xs text-muted-foreground mt-1">
                {Math.ceil(((estimatedPayoffDate?.getTime() || 0) - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))} months remaining
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Accounts */}
        <div className="mint-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Accounts</h2>
            <Link 
              href="/dashboard/accounts" 
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {accounts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>No accounts found.</p>
                <Link 
                  href="/dashboard/accounts/add" 
                  className="text-primary hover:underline text-sm mt-2 inline-block"
                >
                  Add your first account
                </Link>
              </div>
            ) : (
              accounts.map((account) => (
                <div key={account.id} className="flex justify-between items-center p-2 rounded hover:bg-muted/50">
                  <div>
                    <div className="font-medium">{account.name}</div>
                    <div className="text-sm text-muted-foreground">{account.type}</div>
                  </div>
                  <div className={Number(account.value) >= 0 ? 'text-[hsl(var(--income))] font-medium' : 'text-[hsl(var(--expense))] font-medium'}>
                    {formatCurrency(Number(account.value))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Emergency Fund */}
        <div className="mint-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">Emergency Fund</h3>
              <p className="text-sm text-muted-foreground">Goal: {emergencyFund ? formatCurrency(emergencyFund.goal_amount || 0) : '$0'}</p>
            </div>
            <Link href="/dashboard/emergency-fund/edit" className="text-sm text-primary hover:underline">
              {emergencyFund ? 'Edit' : 'Set up'}
            </Link>
          </div>
          
          {emergencyFund ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current</span>
                <span className="font-medium">{formatCurrency(Number(emergencyFund.current_amount) || 0)}</span>
              </div>
              <div className="mint-progress">
                <div 
                  className="h-full rounded-full bg-[hsl(var(--primary))]" 
                  style={{ width: `${Math.min(((Number(emergencyFund.current_amount) || 0) / (Number(emergencyFund.goal_amount) || 1)) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{emergencyFund.target_months || 0} months of expenses</span>
                <span>
                  {Math.round(((Number(emergencyFund.current_amount) || 0) / (Number(emergencyFund.goal_amount) || 1)) * 100)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>No emergency fund set up.</p>
              <Link 
                href="/dashboard/emergency-fund/edit" 
                className="text-primary hover:underline text-sm mt-2 inline-block"
              >
                Set up your emergency fund
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
