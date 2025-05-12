"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "../../utils/format";
import { PlusCircle, ArrowUpRight, ArrowDownRight, CreditCard, Wallet, PiggyBank, BarChart3, Calendar, TrendingUp, PieChart } from "lucide-react";
import Link from "next/link";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '../../utils/auth-service';
import { Account, Transaction, Debt, Budget, EmergencyFund } from '../../types/database';
import { MonthlyTrendChart, MonthlyChartData } from '../../components/dashboard/charts/monthly-trend-chart';
import { ExpenseCategoriesChart, CategoryData } from '../../components/dashboard/charts/expense-categories-chart';

// Define additional types for dashboard display
type BudgetWithProgress = Budget & {
  spent_amount: number;
  percentage: number;
};

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  
  // Financial summary data
  const [netWorth, setNetWorth] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [liabilitiesFromAccounts, setLiabilitiesFromAccounts] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [savingsRate, setSavingsRate] = useState(0);
  const [debtToIncomeRatio, setDebtToIncomeRatio] = useState(0);
  const [estimatedPayoffDate, setEstimatedPayoffDate] = useState<Date | null>(null);
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

        // Get transactions
        const { data: transactionsData } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });
        
        // Initialize variables at a higher scope so they're available throughout the function
        let formattedTransactions: Transaction[] = [];
        let currentMonthTransactions: Transaction[] = [];
        
        // Get current date information for filtering transactions
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        if (transactionsData) {
          // Ensure all transaction data is properly formatted
          formattedTransactions = transactionsData.map(t => ({
            ...t,
            total: Number(t.total),
            date: t.date ? new Date(t.date) : new Date(),
          }));
          
          setTransactions(formattedTransactions);
          
          // Calculate monthly income and expenses
          // Using the date variables defined at the higher scope
          
          // Filter transactions for current month - make it available throughout the function
          const currentMonthTransactions = formattedTransactions.filter((t: Transaction) => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
          });
          
          const income = currentMonthTransactions
            .filter(t => t.type.toLowerCase() === 'income')
            .reduce((sum, t) => sum + Math.abs(Number(t.total)), 0);
          
          const expenses = currentMonthTransactions
            .filter(t => t.type.toLowerCase() === 'expense')
            .reduce((sum, t) => sum + Math.abs(Number(t.total)), 0);
          
          setMonthlyIncome(income);
          setMonthlyExpenses(expenses);
          
          // Calculate savings rate
          if (income > 0) {
            const savingsRateValue = ((income - expenses) / income) * 100;
            setSavingsRate(Math.max(0, savingsRateValue)); // Ensure it's not negative
          }
          
          // Generate monthly data for chart
          const monthlyDataMap = new Map();
          
          // Initialize last 6 months with zero values
          for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            const monthName = date.toLocaleString('default', { month: 'short' });
            
            monthlyDataMap.set(monthKey, {
              month: monthName,
              income: 0,
              expenses: 0,
              savings: 0
            });
          }
          
          // Populate with actual data
          formattedTransactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            
            if (monthlyDataMap.has(monthKey)) {
              const data = monthlyDataMap.get(monthKey);
              
              if (transaction.type.toLowerCase() === 'income') {
                data.income += Math.abs(Number(transaction.total));
              } else if (transaction.type.toLowerCase() === 'expense') {
                data.expenses += Math.abs(Number(transaction.total));
              }
              
              data.savings = data.income - data.expenses;
              monthlyDataMap.set(monthKey, data);
            }
          });
          
          // Convert map to array for chart
          const monthlyChartData = Array.from(monthlyDataMap.values());
          
          setMonthlyData(monthlyChartData);
          
          // Use the same current month transactions for expense categories
          // (reusing the variables defined above)
          
          // Calculate expense categories
          const expensesByCategory: Record<string, number> = {};
          
          // Group expenses by category
          currentMonthTransactions
            .filter((t: Transaction) => t.type.toLowerCase() === 'expense')
            .forEach((transaction: Transaction) => {
              const category = transaction.category || 'Uncategorized';
              if (!expensesByCategory[category]) {
                expensesByCategory[category] = 0;
              }
              expensesByCategory[category] += Math.abs(Number(transaction.total));
            });
          
          // Convert to array format for chart
          const categoryDataArray = Object.entries(expensesByCategory)
            .map(([category, amount]) => ({ category, amount: amount as number }))
            .sort((a, b) => b.amount - a.amount); // Sort by amount descending
          
          setCategoryData(categoryDataArray);
        }

        // Fetch emergency fund records
        const { data: emergencyFundData } = await supabase
          .from('emergency_fund')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (emergencyFundData && emergencyFundData.length > 0) {
          setEmergencyFund(emergencyFundData[0]);
        } else {
          setEmergencyFund(null);
        }

        // Fetch debts
        const { data: debtsData } = await supabase
          .from('debts')
          .select('*');
        
        // Map debts to match our component needs
        const mappedDebts = (debtsData || []).map(debt => ({
          ...debt,
          minimum_payment: debt.min_payment || 0,
        }));
        
        setDebts(mappedDebts);
        
        // Calculate total debt amount
        const debtAmount = (debtsData || []).reduce((sum, debt) => sum + Number(debt.amount || 0), 0);
        setTotalDebt(debtAmount);
        
        // Calculate total monthly debt payments
        const monthlyDebtPayments = (debtsData || []).reduce((sum, debt) => sum + Number(debt.min_payment || 0), 0);
        
        // Now calculate total liabilities (negative accounts + debts)
        const totalLiabilitiesAmount = negativeAccounts + debtAmount;
        setTotalLiabilities(totalLiabilitiesAmount);
        
        // Update net worth calculation
        setNetWorth(assets - totalLiabilitiesAmount);
        
        // Calculate debt-to-income ratio (monthly debt payments / monthly income)
        // This needs to happen after we set the monthly income
        if (monthlyIncome > 0) {
          // Get minimum payments from all debts for DTI calculation
          const monthlyDebtPayments = (debtsData || []).reduce((sum, debt) => sum + Number(debt.min_payment || 0), 0);
          
          // Calculate DTI as a percentage (monthly debt payments / monthly income)
          const dti = (monthlyDebtPayments / monthlyIncome) * 100;
          setDebtToIncomeRatio(dti);
        } else {
          setDebtToIncomeRatio(0); // Default to 0 if no income
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
        
        if (budgetsData && formattedTransactions) {
          // Use the transactions directly for budget calculations
          const currentMonthTxns = formattedTransactions.filter((t: Transaction) => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
          });
          
          // Calculate spent amount for each budget
          const budgetsWithProgress = budgetsData.map(budget => {
            // Find transactions in this category
            const categoryTransactions = currentMonthTxns.filter((t: Transaction) => 
              t.type.toLowerCase() === 'expense' && 
              t.category && 
              t.category.toLowerCase() === budget.category.toLowerCase()
            );
            
            // Calculate total spent
            const spentAmount = categoryTransactions.reduce((sum: number, t: Transaction) => sum + Math.abs(Number(t.total)), 0);
            
            // Calculate percentage
            const percentage = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;
            
            return {
              ...budget,
              spent_amount: spentAmount,
              percentage
            };
          });
          
          // Sort by percentage spent (highest first)
          budgetsWithProgress.sort((a, b) => b.percentage - a.percentage);
          
          setBudgetProgress(budgetsWithProgress);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
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
        <div className="grid gap-4 md:grid-cols-4 animate-pulse">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="mint-card p-4">
              <div className="flex flex-col items-start">
                <div className="h-4 w-24 bg-primary/10 rounded mb-2"></div>
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Net Worth */}
        <div className="mint-card p-6">
          <h2 className="text-lg font-semibold mb-4">Net Worth</h2>
          <div className="text-3xl font-bold mb-2">{formatCurrency(netWorth)}</div>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="text-xl font-bold">{savingsRate.toFixed(0)}%</div>
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
            accounts.slice(0, 5).map((account) => (
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
    </div>
  );
}
