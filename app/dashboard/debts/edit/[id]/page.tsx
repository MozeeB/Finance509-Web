"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '../../../../../utils/auth-service';
import { ArrowLeft, DollarSign, Calendar, Percent, CreditCard, ArrowDown, ArrowUp, Info } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "../../../../../components/ui/use-toast";
import { Debt } from "../../../../../types/database";

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

export default function EditDebtPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debt, setDebt] = useState<Debt | null>(null);

  // Initialize form with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      name: "",
      amount: 0,
      interest_rate: 0,
      min_payment: 0,
      due_date: new Date().toISOString().split('T')[0],
      strategy: "avalanche",
      notes: "",
    },
  });

  // Fetch debt data on component mount
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
        
        // Format date for the form input
        const formattedDate = data.due_date 
          ? new Date(data.due_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        
        // Set form values
        setValue("name", data.name);
        setValue("amount", data.amount);
        setValue("interest_rate", data.interest_rate);
        setValue("min_payment", data.min_payment || 0);
        setValue("due_date", formattedDate);
        setValue("strategy", data.strategy);
        setValue("notes", data.notes || "");
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching debt:', error);
        setError('Failed to load debt data. Please try again.');
        setIsLoading(false);
      }
    }
    
    fetchDebtData();
  }, [unwrappedParams.id, router, setValue]);

  // Handle form submission
  const onSubmit = async (data: DebtFormValues) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Check authentication
      const { success, user } = await getCurrentUser();
      
      if (!success || !user) {
        router.push("/sign-in");
        return;
      }
      
      // Update debt in Supabase
      const supabase = createClientComponentClient();
      const { error } = await supabase
        .from('debts')
        .update({
          name: data.name,
          amount: data.amount,
          interest_rate: data.interest_rate,
          min_payment: data.min_payment,
          due_date: data.due_date,
          strategy: data.strategy,
          notes: data.notes || null,
        })
        .eq('id', unwrappedParams.id);
      
      if (error) {
        throw error;
      }
      
      // Show success message
      toast({
        title: "Success",
        description: "Debt updated successfully!",
        variant: "default",
      });
      
      // Redirect to debts page
      router.push("/dashboard/debts");
    } catch (error) {
      console.error('Error updating debt:', error);
      setError('Failed to update debt. Please try again.');
      setIsSaving(false);
    }
  };

  // Handle debt deletion
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this debt? This action cannot be undone.")) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Check authentication
      const { success, user } = await getCurrentUser();
      
      if (!success || !user) {
        router.push("/sign-in");
        return;
      }
      
      // Delete debt from Supabase
      const supabase = createClientComponentClient();
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', unwrappedParams.id);
      
      if (error) {
        throw error;
      }
      
      // Show success message
      toast({
        title: "Success",
        description: "Debt deleted successfully!",
        variant: "default",
      });
      
      // Redirect to debts page
      router.push("/dashboard/debts");
    } catch (error) {
      console.error('Error deleting debt:', error);
      setError('Failed to delete debt. Please try again.');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/debts" className="mint-button-icon">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">Edit Debt</h1>
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
        <Link href="/dashboard/debts" className="mint-button-icon">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Edit Debt</h1>
      </div>

      <div className="mint-card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 rounded-md bg-primary/10 text-primary text-sm">
              {success}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Debt Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Debt Name
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <input
                  id="name"
                  type="text"
                  className="mint-input pl-10"
                  placeholder="Credit Card, Student Loan, etc."
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Debt Amount */}
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Current Balance
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  className="mint-input pl-10"
                  placeholder="0.00"
                  {...register("amount")}
                />
              </div>
              {errors.amount && (
                <p className="text-destructive text-xs mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <label htmlFor="interest_rate" className="text-sm font-medium">
                Interest Rate (%)
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  className="mint-input pl-10"
                  placeholder="0.00"
                  {...register("interest_rate")}
                />
              </div>
              {errors.interest_rate && (
                <p className="text-destructive text-xs mt-1">{errors.interest_rate.message}</p>
              )}
            </div>

            {/* Minimum Payment */}
            <div className="space-y-2">
              <label htmlFor="min_payment" className="text-sm font-medium">
                Minimum Monthly Payment
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <input
                  id="min_payment"
                  type="number"
                  step="0.01"
                  className="mint-input pl-10"
                  placeholder="0.00"
                  {...register("min_payment")}
                />
              </div>
              {errors.min_payment && (
                <p className="text-destructive text-xs mt-1">{errors.min_payment.message}</p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label htmlFor="due_date" className="text-sm font-medium">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <input
                  id="due_date"
                  type="date"
                  className="mint-input pl-10"
                  {...register("due_date")}
                />
              </div>
              {errors.due_date && (
                <p className="text-destructive text-xs mt-1">{errors.due_date.message}</p>
              )}
            </div>

            {/* Repayment Strategy */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Repayment Strategy</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center">
                  <input
                    id="avalanche"
                    type="radio"
                    value="avalanche"
                    className="h-4 w-4 text-primary border-muted-foreground focus:ring-primary"
                    {...register("strategy")}
                  />
                  <label
                    htmlFor="avalanche"
                    className="ml-2 flex items-center gap-1 text-sm font-medium"
                  >
                    <ArrowDown className="h-4 w-4 text-primary" />
                    Avalanche
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="snowball"
                    type="radio"
                    value="snowball"
                    className="h-4 w-4 text-primary border-muted-foreground focus:ring-primary"
                    {...register("strategy")}
                  />
                  <label
                    htmlFor="snowball"
                    className="ml-2 flex items-center gap-1 text-sm font-medium"
                  >
                    <ArrowUp className="h-4 w-4 text-primary" />
                    Snowball
                  </label>
                </div>
              </div>
              {errors.strategy && (
                <p className="text-destructive text-xs mt-1">{errors.strategy.message}</p>
              )}
              <div className="flex items-start gap-2 mt-2 p-2 rounded-md bg-muted/50">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Avalanche: Pay highest interest debts first to minimize interest.
                  <br />
                  Snowball: Pay smallest debts first for psychological wins.
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              className="mint-input min-h-[100px]"
              placeholder="Add any additional notes about this debt..."
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-destructive text-xs mt-1">{errors.notes.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              className="mint-button"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <Link href="/dashboard/debts" className="mint-button-secondary text-center">
              Cancel
            </Link>
            <button
              type="button"
              className="mint-button-destructive ml-auto"
              onClick={handleDelete}
              disabled={isSaving}
            >
              Delete Debt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
