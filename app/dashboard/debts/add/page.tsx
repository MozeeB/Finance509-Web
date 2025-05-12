"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '@/utils/auth-service';
import { ArrowLeft, DollarSign, Calendar, Percent, CreditCard, ArrowDown, ArrowUp, Info } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Define form schema with Zod
const debtSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  interest_rate: z.coerce.number().min(0, "Interest rate cannot be negative"),
  min_payment: z.coerce.number().min(0, "Minimum payment cannot be negative"),
  due_date: z.string().nonempty("Due date is required"),
  strategy: z.enum(["avalanche", "snowball"]),
  notes: z.string().optional(),
});

type DebtFormValues = z.infer<typeof debtSchema>;

export default function AddDebtPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // React Hook Form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      due_date: new Date().toISOString().split('T')[0],
      strategy: "avalanche",
      interest_rate: 0,
      min_payment: 0,
      notes: "",
    },
  });

  // Watch the strategy to adjust UI
  const strategy = watch("strategy");
  const amount = watch("amount");
  const interestRate = watch("interest_rate");
  const minPayment = watch("min_payment");

  useEffect(() => {
    async function checkAuth() {
      try {
        const { success, user } = await getCurrentUser();
        
        if (!success || !user) {
          router.push("/sign-in");
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push("/sign-in");
      }
    }
    
    checkAuth();
  }, [router]);

  const onSubmit = async (data: DebtFormValues) => {
    try {
      setIsSaving(true);
      setError(null);
      
      const supabase = createClientComponentClient();
      
      // Get user
      const { success, user } = await getCurrentUser();
      
      if (!success || !user) {
        router.push("/sign-in");
        return;
      }
      
      // Create debt
      const { error: debtError } = await supabase
        .from('debts')
        .insert({
          name: data.name,
          amount: data.amount,
          interest_rate: data.interest_rate,
          min_payment: data.min_payment,
          due_date: data.due_date,
          strategy: data.strategy,
          notes: data.notes || null,
          // No user_id field as it doesn't exist in the debts table
          created_at: new Date().toISOString(),
        });
      
      if (debtError) throw debtError;
      
      setSuccess('Debt added successfully!');
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/dashboard/debts');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving debt:', error);
      setError(error.message || 'Failed to save debt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate time to pay off debt
  const calculatePayoffTime = () => {
    if (!amount || !minPayment || minPayment <= 0) return "N/A";
    
    const monthlyInterestRate = interestRate / 100 / 12;
    let balance = amount;
    let months = 0;
    
    // Simple calculation for display purposes
    while (balance > 0 && months < 360) { // Cap at 30 years
      const interestPayment = balance * monthlyInterestRate;
      const principalPayment = Math.min(minPayment - interestPayment, balance);
      
      if (minPayment <= interestPayment) {
        return "Never (payment too low)";
      }
      
      balance -= principalPayment;
      months++;
    }
    
    if (months >= 360) return "30+ years";
    
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/debts" className="rounded-md p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Add Debt</h1>
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
      <div className="flex items-center gap-2">
        <Link href="/dashboard/debts" className="rounded-md p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Add Debt</h1>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-800 p-4 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="mint-card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Debt Name */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">
                <div className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  Debt Name
                </div>
              </label>
              <input
                type="text"
                id="name"
                placeholder="e.g., Credit Card, Student Loan"
                className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-destructive' : ''}`}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Debt Amount & Interest Rate */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="amount">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Current Balance
                  </div>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <input
                    type="number"
                    id="amount"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className={`w-full pl-7 px-3 py-2 border rounded-md ${errors.amount ? 'border-destructive' : ''}`}
                    {...register("amount")}
                  />
                </div>
                {errors.amount && (
                  <p className="text-destructive text-xs mt-1">{errors.amount.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="interest_rate">
                  <div className="flex items-center gap-1">
                    <Percent className="h-4 w-4" />
                    Interest Rate
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="interest_rate"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={`w-full px-3 py-2 border rounded-md ${errors.interest_rate ? 'border-destructive' : ''}`}
                    {...register("interest_rate")}
                  />
                  <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                </div>
                {errors.interest_rate && (
                  <p className="text-destructive text-xs mt-1">{errors.interest_rate.message}</p>
                )}
              </div>
            </div>

            {/* Minimum Payment & Due Date */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="min_payment">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Minimum Payment
                  </div>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <input
                    type="number"
                    id="min_payment"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={`w-full pl-7 px-3 py-2 border rounded-md ${errors.min_payment ? 'border-destructive' : ''}`}
                    {...register("min_payment")}
                  />
                </div>
                {errors.min_payment && (
                  <p className="text-destructive text-xs mt-1">{errors.min_payment.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="due_date">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </div>
                </label>
                <input
                  type="date"
                  id="due_date"
                  className={`w-full px-3 py-2 border rounded-md ${errors.due_date ? 'border-destructive' : ''}`}
                  {...register("due_date")}
                />
                {errors.due_date && (
                  <p className="text-destructive text-xs mt-1">{errors.due_date.message}</p>
                )}
              </div>
            </div>

            {/* Repayment Strategy */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Repayment Strategy
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer flex items-center gap-3 ${
                    strategy === "avalanche" 
                      ? "border-primary bg-primary/10" 
                      : "border-muted hover:border-muted-foreground"
                  }`}
                  onClick={() => setValue("strategy", "avalanche")}
                >
                  <div className={`p-2 rounded-full ${
                    strategy === "avalanche" 
                      ? "bg-primary" 
                      : "bg-muted"
                  }`}>
                    <ArrowDown className={`h-4 w-4 ${
                      strategy === "avalanche" 
                        ? "text-primary-foreground" 
                        : "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">Avalanche</p>
                    <p className="text-xs text-muted-foreground">Highest interest first</p>
                  </div>
                </div>
                
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer flex items-center gap-3 ${
                    strategy === "snowball" 
                      ? "border-primary bg-primary/10" 
                      : "border-muted hover:border-muted-foreground"
                  }`}
                  onClick={() => setValue("strategy", "snowball")}
                >
                  <div className={`p-2 rounded-full ${
                    strategy === "snowball" 
                      ? "bg-primary" 
                      : "bg-muted"
                  }`}>
                    <ArrowUp className={`h-4 w-4 ${
                      strategy === "snowball" 
                        ? "text-primary-foreground" 
                        : "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">Snowball</p>
                    <p className="text-xs text-muted-foreground">Smallest balance first</p>
                  </div>
                </div>
              </div>
              <input type="hidden" {...register("strategy")} />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="notes">
                <div className="flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  Notes (Optional)
                </div>
              </label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Any additional details about this debt"
                className="w-full px-3 py-2 border rounded-md"
                {...register("notes")}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className={`w-full mint-button py-2 ${isSaving ? 'opacity-70' : ''}`}
              >
                {isSaving ? 'Saving...' : 'Add Debt'}
              </button>
            </div>
          </form>
        </div>

        <div className="mint-card p-6">
          <h2 className="text-lg font-medium mb-4">Debt Insights</h2>
          
          <div className="space-y-5">
            {amount > 0 && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <h3 className="font-medium mb-2">Payoff Estimate</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Time to pay off:</p>
                    <p className="font-medium">{calculatePayoffTime()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly interest:</p>
                    <p className="font-medium">${((amount * (interestRate / 100)) / 12).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-4 bg-primary/10 rounded-lg">
              <h3 className="font-medium mb-2">Repayment Strategies</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium flex items-center gap-1">
                    <ArrowDown className="h-4 w-4 text-primary" />
                    Avalanche Method
                  </p>
                  <p className="text-sm">Pay minimum payments on all debts, then put extra money toward the debt with the highest interest rate.</p>
                  <p className="text-xs text-muted-foreground mt-1">Best for: Minimizing total interest paid</p>
                </div>
                
                <div>
                  <p className="font-medium flex items-center gap-1">
                    <ArrowUp className="h-4 w-4 text-primary" />
                    Snowball Method
                  </p>
                  <p className="text-sm">Pay minimum payments on all debts, then put extra money toward the debt with the smallest balance.</p>
                  <p className="text-xs text-muted-foreground mt-1">Best for: Psychological wins and motivation</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-primary/10 rounded-lg">
              <h3 className="font-medium mb-2">Tips for Debt Repayment</h3>
              <ul className="text-sm space-y-1.5">
                <li>• Always pay at least the minimum payment on all debts</li>
                <li>• Consider balance transfers for high-interest credit cards</li>
                <li>• Look into refinancing options for large loans</li>
                <li>• Set up automatic payments to avoid late fees</li>
                <li>• Put any windfalls (tax refunds, bonuses) toward debt</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
