"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '@/utils/auth-service';
import { ArrowLeft, DollarSign, Calculator, PiggyBank, Info } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatCurrency } from "@/utils/format";
import { EmergencyFund } from "@/types/database";

// Define form schema with Zod
const emergencyFundSchema = z.object({
  current_amount: z.coerce.number().min(0, "Amount cannot be negative"),
  goal_amount: z.coerce.number().min(0, "Goal amount cannot be negative"),
  target_months: z.coerce.number().min(1, "Target months must be at least 1"),
  notes: z.string().optional(),
});

type EmergencyFundFormValues = z.infer<typeof emergencyFundSchema>;

export default function EditEmergencyFundPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingFund, setExistingFund] = useState<EmergencyFund | null>(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  // React Hook Form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<EmergencyFundFormValues>({
    resolver: zodResolver(emergencyFundSchema),
    defaultValues: {
      current_amount: 0,
      goal_amount: 0,
      target_months: 3,
      notes: "",
    },
  });

  // Watch form values for calculations
  const targetMonths = watch("target_months");
  const currentAmount = watch("current_amount");
  const goalAmount = watch("goal_amount");

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const supabase = createClientComponentClient();
        
        // Get user
        const { success, user } = await getCurrentUser();
        
        if (!success || !user) {
          router.push("/sign-in");
          return;
        }

        // Fetch existing emergency fund
        const { data: fundData } = await supabase
          .from('emergency_fund')
          .select('*')
          .single();
        
        setExistingFund(fundData);
        setIsEditing(!!fundData);
        
        // If fund exists, populate form
        if (fundData) {
          reset({
            current_amount: fundData.current_amount,
            goal_amount: fundData.goal_amount,
            target_months: fundData.target_months,
            notes: fundData.notes || "",
          });
        }

        // Calculate monthly expenses for suggestions
        const { data: transactions } = await supabase
          .from('transactions')
          .select('total, type')
          .eq('type', 'Expense')
          .gte('date', new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString())
          .lte('date', new Date().toISOString());
        
        // Average monthly expenses over the last 3 months
        const totalExpenses = (transactions || []).reduce((sum, t) => sum + Math.abs(t.total), 0);
        const avgMonthlyExpenses = totalExpenses / 3;
        
        setMonthlyExpenses(avgMonthlyExpenses);
        
        // If no fund exists, set suggested goal amount based on expenses
        if (!fundData && avgMonthlyExpenses > 0) {
          setValue("goal_amount", Math.round(avgMonthlyExpenses * 3));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [router, reset, setValue]);

  // Update goal amount when target months changes
  useEffect(() => {
    if (monthlyExpenses > 0 && targetMonths > 0) {
      const suggestedGoal = Math.round(monthlyExpenses * targetMonths);
      setValue("goal_amount", suggestedGoal);
    }
  }, [targetMonths, monthlyExpenses, setValue]);

  const onSubmit = async (data: EmergencyFundFormValues) => {
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
      
      if (existingFund) {
        // Update existing fund
        const { error: updateError } = await supabase
          .from('emergency_fund')
          .update({
            current_amount: data.current_amount,
            goal_amount: data.goal_amount,
            target_months: data.target_months,
            notes: data.notes || null,
          })
          .eq('id', existingFund.id);
        
        if (updateError) throw updateError;
      } else {
        // Create new fund
        const { error: createError } = await supabase
          .from('emergency_fund')
          .insert({
            current_amount: data.current_amount,
            goal_amount: data.goal_amount,
            target_months: data.target_months,
            notes: data.notes || null,
            created_at: new Date().toISOString(),
          });
        
        if (createError) throw createError;
      }
      
      setSuccess('Emergency fund saved successfully!');
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/dashboard/emergency-fund');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving emergency fund:', error);
      setError(error.message || 'Failed to save emergency fund. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate progress percentage
  const progressPercentage = goalAmount > 0 
    ? Math.min(Math.round((currentAmount / goalAmount) * 100), 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/emergency-fund" className="rounded-md p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit' : 'Set Up'} Emergency Fund</h1>
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
        <Link href="/dashboard/emergency-fund" className="rounded-md p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit' : 'Set Up'} Emergency Fund</h1>
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
            {/* Current Amount */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="current_amount">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Current Amount
                </div>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <input
                  type="number"
                  id="current_amount"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={`w-full pl-7 px-3 py-2 border rounded-md ${errors.current_amount ? 'border-destructive' : ''}`}
                  {...register("current_amount")}
                />
              </div>
              {errors.current_amount && (
                <p className="text-destructive text-xs mt-1">{errors.current_amount.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                How much do you currently have saved for emergencies?
              </p>
            </div>

            {/* Target Months */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="target_months">
                <div className="flex items-center gap-1">
                  <Calculator className="h-4 w-4" />
                  Target Months of Expenses
                </div>
              </label>
              <input
                type="number"
                id="target_months"
                min="1"
                max="24"
                className={`w-full px-3 py-2 border rounded-md ${errors.target_months ? 'border-destructive' : ''}`}
                {...register("target_months")}
              />
              {errors.target_months && (
                <p className="text-destructive text-xs mt-1">{errors.target_months.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Financial experts typically recommend 3-6 months
              </p>
            </div>

            {/* Goal Amount (calculated but editable) */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="goal_amount">
                <div className="flex items-center gap-1">
                  <PiggyBank className="h-4 w-4" />
                  Goal Amount
                </div>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <input
                  type="number"
                  id="goal_amount"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={`w-full pl-7 px-3 py-2 border rounded-md ${errors.goal_amount ? 'border-destructive' : ''}`}
                  {...register("goal_amount")}
                />
              </div>
              {errors.goal_amount && (
                <p className="text-destructive text-xs mt-1">{errors.goal_amount.message}</p>
              )}
              {monthlyExpenses > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Based on your average monthly expenses of {formatCurrency(monthlyExpenses)}
                </p>
              )}
            </div>

            {/* Progress Preview */}
            {goalAmount > 0 && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-medium">{progressPercentage}%</span>
                </div>
                <div className="mint-progress mb-2">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-sm text-center">
                  {formatCurrency(goalAmount - currentAmount)} left to reach your goal
                </p>
              </div>
            )}

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
                placeholder="Any additional details about your emergency fund"
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
                {isSaving ? 'Saving...' : (isEditing ? 'Update' : 'Create') + ' Emergency Fund'}
              </button>
            </div>
          </form>
        </div>

        <div className="mint-card p-6">
          <h2 className="text-lg font-medium mb-4">Emergency Fund Guide</h2>
          
          <div className="space-y-5">
            <div className="p-4 bg-primary/10 rounded-lg">
              <h3 className="font-medium mb-2">What is an Emergency Fund?</h3>
              <p className="text-sm">An emergency fund is money set aside to cover unexpected expenses or financial emergencies, such as:</p>
              <ul className="text-sm mt-2 space-y-1 list-disc pl-5">
                <li>Medical emergencies</li>
                <li>Job loss or reduced income</li>
                <li>Urgent home or car repairs</li>
                <li>Unexpected travel needs</li>
                <li>Unplanned bills or expenses</li>
              </ul>
            </div>
            
            <div className="p-4 bg-primary/10 rounded-lg">
              <h3 className="font-medium mb-2">How Much Should I Save?</h3>
              <div className="space-y-3 text-sm">
                <p><strong>Starter Fund:</strong> $1,000 for small emergencies</p>
                <p><strong>Basic Fund:</strong> 3 months of essential expenses</p>
                <p><strong>Secure Fund:</strong> 6 months of essential expenses</p>
                <p><strong>Extended Fund:</strong> 9-12 months (for variable income or specialized careers)</p>
              </div>
            </div>
            
            <div className="p-4 bg-primary/10 rounded-lg">
              <h3 className="font-medium mb-2">Tips for Building Your Fund</h3>
              <ul className="text-sm space-y-1.5">
                <li>• Start small and build consistently</li>
                <li>• Set up automatic transfers to your emergency fund</li>
                <li>• Keep the fund in a separate, easily accessible account</li>
                <li>• Use windfalls (tax refunds, bonuses) to boost your fund</li>
                <li>• Replenish the fund after using it for emergencies</li>
                <li>• Review and adjust your goal as your expenses change</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
