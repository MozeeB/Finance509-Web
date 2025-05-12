"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '@/utils/auth-service';
import { ArrowLeft, CalendarClock, DollarSign, Percent, CreditCard, FileText, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/utils/format";
import { Debt } from '@/types/database';
import { useToast } from "@/components/ui/use-toast";

export default function DebtViewPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debt, setDebt] = useState<Debt | null>(null);
  const [payoffDate, setPayoffDate] = useState<string | null>(null);
  const [totalInterest, setTotalInterest] = useState<number>(0);

  useEffect(() => {
    async function fetchDebtData() {
      try {
        // Check authentication
        const { success, user } = await getCurrentUser();
        
        if (!success || !user) {
          router.push("/sign-in");
          return;
        }
        
        // Fetch debt data
        const supabase = createClientComponentClient();
        const { data, error } = await supabase
          .from('debts')
          .select('*')
          .eq('id', unwrappedParams.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          router.push('/dashboard/debts');
          return;
        }
        
        // Set debt data
        setDebt(data);
        
        // Calculate estimated payoff date and total interest
        if (data.min_payment && data.amount && data.interest_rate) {
          calculatePayoffDetails(data.amount, data.interest_rate, data.min_payment);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching debt:', error);
        setError('Failed to load debt data. Please try again.');
        setIsLoading(false);
      }
    }
    
    fetchDebtData();
  }, [unwrappedParams.id, router]);

  // Calculate payoff date and total interest
  const calculatePayoffDetails = (balance: number, interestRate: number, minPayment: number) => {
    // Convert annual interest rate to monthly
    const monthlyRate = interestRate / 100 / 12;
    
    // Initialize variables for calculation
    let remainingBalance = balance;
    let months = 0;
    let totalInterestPaid = 0;
    
    // Calculate months to payoff and total interest
    while (remainingBalance > 0 && months < 1200) { // Cap at 100 years to prevent infinite loop
      // Calculate interest for this month
      const interestThisMonth = remainingBalance * monthlyRate;
      totalInterestPaid += interestThisMonth;
      
      // Calculate principal payment
      let payment = Math.min(minPayment, remainingBalance + interestThisMonth);
      const principalPayment = payment - interestThisMonth;
      
      // Update remaining balance
      remainingBalance -= principalPayment;
      months++;
    }
    
    // Calculate payoff date
    const today = new Date();
    const payoffDateObj = new Date(today);
    payoffDateObj.setMonth(today.getMonth() + months);
    
    // Format payoff date
    const payoffDateStr = payoffDateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    setPayoffDate(payoffDateStr);
    setTotalInterest(totalInterestPaid);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/debts" className="mint-button-icon">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">Debt Details</h1>
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

  if (error || !debt) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/debts" className="mint-button-icon">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">Debt Details</h1>
        </div>
        <div className="mint-card p-8 text-center">
          <div className="text-destructive mb-4">
            {error || "Debt not found"}
          </div>
          <Link href="/dashboard/debts" className="mint-button">
            Back to Debts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/debts" className="mint-button-icon">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Debt Details</h1>
      </div>

      {/* Debt Overview Card */}
      <div className="mint-card mint-card-hover">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold">{debt.name}</h2>
            <p className="text-muted-foreground">
              {debt.strategy.charAt(0).toUpperCase() + debt.strategy.slice(1)} Strategy
            </p>
          </div>
          <div className="flex gap-2">
            <Link 
              href={`/dashboard/debts/edit/${debt.id}`} 
              className="mint-button-secondary py-2 px-4"
            >
              Edit Debt
            </Link>
          </div>
        </div>

        {/* Debt Amount and Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="mint-card bg-muted/30 border-none">
            <div className="text-lg font-medium text-muted-foreground mb-1">Current Balance</div>
            <div className="text-3xl font-bold text-[hsl(var(--expense))]">
              {formatCurrency(debt.amount)}
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Interest Rate</div>
                <div className="flex items-center gap-1 mt-1">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-medium">{debt.interest_rate}%</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Min Payment</div>
                <div className="flex items-center gap-1 mt-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-medium">{formatCurrency(debt.min_payment || 0)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mint-card bg-muted/30 border-none">
            <div className="text-lg font-medium text-muted-foreground mb-1">Payoff Details</div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Due Date</div>
                <div className="flex items-center gap-1 mt-1">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-base font-medium">{debt.due_date}</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Est. Payoff Date</div>
                <div className="flex items-center gap-1 mt-1">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-base font-medium">{payoffDate || "N/A"}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm font-medium text-muted-foreground">Total Interest to Pay</div>
              <div className="flex items-center gap-1 mt-1">
                <DollarSign className="h-4 w-4 text-[hsl(var(--expense))]" />
                <span className="text-lg font-medium text-[hsl(var(--expense))]">
                  {formatCurrency(totalInterest)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Repayment Strategy */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Repayment Strategy</h3>
          <div className="mint-card bg-muted/30 border-none p-4">
            <div className="flex items-start gap-3">
              {debt.strategy.toLowerCase() === 'avalanche' ? (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowDownCircle className="h-5 w-5 text-primary" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowUpCircle className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <h4 className="font-medium">
                  {debt.strategy.toLowerCase() === 'avalanche' ? 'Avalanche Method' : 'Snowball Method'}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {debt.strategy.toLowerCase() === 'avalanche' 
                    ? 'Paying off debts with the highest interest rates first to minimize interest payments.'
                    : 'Paying off smallest debts first to build momentum and motivation.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {debt.notes && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Notes</h3>
            <div className="mint-card bg-muted/30 border-none p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <p className="text-sm">{debt.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Tips */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Payment Tips</h3>
          <div className="mint-card bg-primary/10 border-none p-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-primary mt-0.5" />
                <span>Paying just 10% more than the minimum payment can reduce your payoff time by months or years.</span>
              </li>
              <li className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-primary mt-0.5" />
                <span>Consider making bi-weekly payments instead of monthly to reduce interest and pay off faster.</span>
              </li>
              <li className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-primary mt-0.5" />
                <span>Set up automatic payments to avoid late fees and potential credit score impacts.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
