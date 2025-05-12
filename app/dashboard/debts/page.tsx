"use client";

import { formatCurrency } from "../../../utils/format";
import { PlusCircle, ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '../../../utils/auth-service';
import { Debt } from '../../../types/database';

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalMonthlyPayment, setTotalMonthlyPayment] = useState(0);
  const [estimatedPayoffDate, setEstimatedPayoffDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const [sortOption, setSortOption] = useState<'interest' | 'balance' | 'name'>('interest');

  useEffect(() => {
    async function fetchDebts() {
      try {
        const supabase = createClientComponentClient();
        
        // Get user using auth-service
        const { success, user } = await getCurrentUser();
        
        if (!success || !user) {
          setIsLoading(false);
          return;
        }

        // Fetch debts
        const { data: debts } = await supabase
          .from('debts')
          .select('*');
        // Note: No user_id filter as the column doesn't exist in the debts table
        
        // Map debts to match our component needs
        const mappedDebts = (debts || []).map(debt => ({
          ...debt,
          minimum_payment: debt.min_payment, // Map min_payment to minimum_payment for UI consistency
        }));
        
        setDebts(mappedDebts);
        
        // Calculate total debt amount
        const total = mappedDebts.reduce((sum, debt) => sum + Number(debt.amount), 0);
        setTotalDebt(total);

        // Calculate total interest paid per year (simplified)
        const yearlyInterest = mappedDebts.reduce((sum, debt) => {
          const interestRate = Number(debt.interest_rate) / 100;
          return sum + (Number(debt.amount) * interestRate);
        }, 0);
        setTotalInterest(yearlyInterest);
        
        // Calculate total monthly payment
        const monthlyPayment = mappedDebts.reduce((sum, debt) => sum + Number(debt.min_payment || 0), 0);
        setTotalMonthlyPayment(monthlyPayment);
        
        // Estimate payoff date (simplified calculation)
        if (mappedDebts.length > 0 && monthlyPayment > 0) {
          // Simple estimation assuming constant payments and no additional interest accrual
          // For a more accurate calculation, we would need to simulate month-by-month payoff
          const averageInterestRate = mappedDebts.reduce((sum, debt) => sum + Number(debt.interest_rate), 0) / mappedDebts.length / 100 / 12;
          const monthsToPayoff = Math.log(1 / (1 - (total * averageInterestRate / monthlyPayment))) / Math.log(1 + averageInterestRate);
          
          // Handle edge cases and ensure reasonable result
          const finalMonths = isNaN(monthsToPayoff) || !isFinite(monthsToPayoff) || monthsToPayoff < 0 
            ? total / monthlyPayment  // Fallback to simple division if complex formula fails
            : monthsToPayoff;
            
          const payoffDate = new Date();
          payoffDate.setMonth(payoffDate.getMonth() + Math.ceil(finalMonths));
          setEstimatedPayoffDate(payoffDate);
        } else {
          setEstimatedPayoffDate(null);
        }
      } catch (error) {
        console.error('Error fetching debts:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDebts();
  }, []);

  // Sort debts based on selected strategy and sort option
  const sortedDebts = [...debts].sort((a, b) => {
    // First apply the strategy sorting
    if (strategy === 'avalanche') {
      // Avalanche: Sort by interest rate (highest first)
      return Number(b.interest_rate) - Number(a.interest_rate);
    } else {
      // Snowball: Sort by amount (lowest first)
      return Number(a.amount) - Number(b.amount);
    }
  });
  
  // Apply additional sorting if needed
  const getAdditionalSortedDebts = () => {
    if (sortOption === 'interest') {
      return [...debts].sort((a, b) => Number(b.interest_rate) - Number(a.interest_rate));
    } else if (sortOption === 'balance') {
      return [...debts].sort((a, b) => Number(b.amount) - Number(a.amount));
    } else {
      return [...debts].sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Debts</h1>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Debts</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex rounded-md overflow-hidden border border-input">
            <button
              onClick={() => setStrategy('avalanche')}
              className={`px-3 py-2 text-sm font-medium flex items-center gap-1 ${strategy === 'avalanche' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
            >
              <ArrowDown className="h-4 w-4" />
              Avalanche
            </button>
            <button
              onClick={() => setStrategy('snowball')}
              className={`px-3 py-2 text-sm font-medium flex items-center gap-1 ${strategy === 'snowball' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/50'}`}
            >
              <ArrowUp className="h-4 w-4" />
              Snowball
            </button>
          </div>
          <div className="flex rounded-md overflow-hidden border border-input">
            <button
              onClick={() => setSortOption('interest')}
              className={`px-3 py-1.5 text-sm font-medium ${sortOption === 'interest' ? 'bg-muted text-primary' : 'bg-background hover:bg-muted/50'}`}
            >
              Interest
            </button>
            <button
              onClick={() => setSortOption('balance')}
              className={`px-3 py-1.5 text-sm font-medium ${sortOption === 'balance' ? 'bg-muted text-primary' : 'bg-background hover:bg-muted/50'}`}
            >
              Balance
            </button>
            <button
              onClick={() => setSortOption('name')}
              className={`px-3 py-1.5 text-sm font-medium ${sortOption === 'name' ? 'bg-muted text-primary' : 'bg-background hover:bg-muted/50'}`}
            >
              Name
            </button>
          </div>
          <Link href="/dashboard/debts/add" className="mint-button flex items-center gap-1">
            <PlusCircle className="h-4 w-4" />
            Add Debt
          </Link>
        </div>
      </div>
      
      {/* Debt Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="mint-card bg-muted/30 p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Debt</div>
          <div className="text-2xl font-bold text-[hsl(var(--expense))]">  
            {formatCurrency(totalDebt)}
          </div>
        </div>
        <div className="mint-card bg-muted/30 p-4">
          <div className="text-sm font-medium text-muted-foreground">Monthly Payment</div>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(totalMonthlyPayment)}
          </div>
        </div>
        <div className="mint-card bg-muted/30 p-4">
          <div className="text-sm font-medium text-muted-foreground">Est. Payoff Date</div>
          <div className="text-2xl font-bold">
            {estimatedPayoffDate 
              ? estimatedPayoffDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Debts List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Debts</h2>
        </div>
        
        {sortedDebts.length > 0 ? (
          <div className="mint-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Priority</th>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-right font-medium">Balance</th>
                    <th className="px-4 py-3 text-right font-medium">Interest Rate</th>
                    <th className="px-4 py-3 text-right font-medium">Due Date</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDebts.map((debt, index) => (
                    <tr 
                      key={debt.id} 
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        <Link 
                          href={`/dashboard/debts/view/${debt.id}`} 
                          className="hover:text-primary hover:underline"
                        >
                          {debt.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-[hsl(var(--expense))]">
                        {formatCurrency(debt.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {debt.interest_rate}%
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {debt.due_date ? new Date(debt.due_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link 
                          href={`/dashboard/debts/view/${debt.id}`} 
                          className="mint-button-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mint-card p-8 text-center">
            <h3 className="text-lg font-medium">No debts found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first debt to start tracking your repayment progress.
            </p>
            <div className="mt-4">
              <Link 
                href="/dashboard/debts/add" 
                className="mint-button inline-flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Add Debt
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
