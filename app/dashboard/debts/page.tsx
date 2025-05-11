"use client";

import { formatCurrency } from "@/utils/format";
import { PlusCircle, ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '@/utils/auth-service';
import { Debt } from '@/types/database';

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [strategy, setStrategy] = useState<'Avalanche' | 'Snowball'>('Avalanche');

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
          .select('*')
          .eq('user_id', user.id);
        
        // Map debts to match our component needs
        const mappedDebts = (debts || []).map(debt => ({
          ...debt,
          minimum_payment: debt.min_payment, // Map min_payment to minimum_payment for UI consistency
        }));
        
        setDebts(mappedDebts);
        
        // Calculate totals
        const totalAmount = mappedDebts.reduce((sum, debt) => sum + debt.amount, 0);
        const totalInterestAmount = mappedDebts.reduce((sum, debt) => {
          const monthlyInterest = (debt.interest_rate / 100) * debt.amount / 12;
          return sum + monthlyInterest;
        }, 0);
        
        setTotalDebt(totalAmount);
        setTotalInterest(totalInterestAmount);
        
        // Get preferred strategy
        if (debts && debts.length > 0) {
          setStrategy(debts[0].strategy);
        }
      } catch (error) {
        console.error('Error fetching debts:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDebts();
  }, []);

  // Sort debts based on strategy
  const sortedDebts = [...debts].sort((a, b) => {
    if (strategy === 'Avalanche') {
      // Sort by interest rate (highest first)
      return b.interest_rate - a.interest_rate;
    } else {
      // Sort by amount (lowest first)
      return a.amount - b.amount;
    }
  });

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Debts</h1>
        <Link 
          href="/dashboard/debts/add" 
          className="mint-button flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Debt
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="mint-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Debt</div>
          <div className="mt-1 text-2xl font-bold text-[hsl(var(--expense))]">{formatCurrency(totalDebt)}</div>
        </div>
        
        <div className="mint-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Monthly Interest</div>
          <div className="mt-1 text-2xl font-bold text-[hsl(var(--expense))]">{formatCurrency(totalInterest)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatCurrency(totalInterest * 12)} per year
          </div>
        </div>
        
        <div className="mint-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Repayment Strategy</div>
          <div className="mt-1 text-2xl font-bold flex items-center gap-2">
            {strategy === 'Avalanche' ? (
              <>
                <ArrowDown className="h-5 w-5 text-[hsl(var(--income))]" />
                <span>Avalanche</span>
              </>
            ) : (
              <>
                <ArrowUp className="h-5 w-5 text-[hsl(var(--income))]" />
                <span>Snowball</span>
              </>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {strategy === 'Avalanche' 
              ? 'Highest interest first' 
              : 'Smallest balance first'}
          </div>
        </div>
      </div>

      {/* Debts List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Debts</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setStrategy('Avalanche')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                strategy === 'Avalanche' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Avalanche
            </button>
            <button 
              onClick={() => setStrategy('Snowball')}
              className={`px-3 py-1.5 rounded-md text-sm ${
                strategy === 'Snowball' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Snowball
            </button>
          </div>
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
                          href={`/dashboard/debts/${debt.id}`} 
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
                          href={`/dashboard/debts/${debt.id}`} 
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
