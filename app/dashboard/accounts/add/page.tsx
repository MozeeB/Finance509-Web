"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '@/utils/auth-service';
import { ArrowLeft, Building, CreditCard, Wallet, DollarSign, PiggyBank, Info } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Define form schema with Zod
const accountSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.string().nonempty("Account type is required"),
  value: z.coerce.number(),
  currency: z.string().nonempty("Currency is required"),
  notes: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

// Account type options
const accountTypes = [
  { value: "Cash", label: "Cash", icon: <Wallet className="h-4 w-4" /> },
  { value: "Checking", label: "Checking Account", icon: <Building className="h-4 w-4" /> },
  { value: "Savings", label: "Savings Account", icon: <PiggyBank className="h-4 w-4" /> },
  { value: "Credit Card", label: "Credit Card", icon: <CreditCard className="h-4 w-4" /> },
  { value: "Investment", label: "Investment", icon: <DollarSign className="h-4 w-4" /> },
  { value: "Other", label: "Other", icon: <Info className="h-4 w-4" /> },
];

// Currency options
const currencies = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
  { value: "CAD", label: "Canadian Dollar ($)" },
  { value: "AUD", label: "Australian Dollar ($)" },
];

export default function AddAccountPage() {
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
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      type: "Checking",
      value: 0,
      currency: "USD",
      notes: "",
    },
  });

  // Watch the account type to adjust UI
  const accountType = watch("type");

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

  const onSubmit = async (data: AccountFormValues) => {
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
      
      // Create account
      const { error: accountError } = await supabase
        .from('accounts')
        .insert({
          name: data.name,
          type: data.type,
          value: data.value,
          currency: data.currency,
          notes: data.notes || null,
          user_id: user.id,
          created_at: new Date().toISOString(),
        });
      
      if (accountError) throw accountError;
      
      setSuccess('Account added successfully!');
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/dashboard/accounts');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving account:', error);
      setError(error.message || 'Failed to save account. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/accounts" className="rounded-md p-2 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Add Account</h1>
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
        <Link href="/dashboard/accounts" className="rounded-md p-2 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Add Account</h1>
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

      <div className="mint-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Account Name
            </label>
            <input
              type="text"
              id="name"
              placeholder="e.g., Chase Checking"
              className={`w-full px-3 py-2 border rounded-md ${errors.name ? 'border-destructive' : ''}`}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Account Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {accountTypes.map((type) => (
                <div 
                  key={type.value}
                  className={`p-3 rounded-lg border-2 cursor-pointer flex items-center gap-2 ${
                    accountType === type.value 
                      ? "border-primary bg-primary/10" 
                      : "border-muted hover:border-muted-foreground"
                  }`}
                  onClick={() => setValue("type", type.value)}
                >
                  <div className={`p-1.5 rounded-full ${
                    accountType === type.value 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {type.icon}
                  </div>
                  <span className="text-sm font-medium">{type.label}</span>
                </div>
              ))}
            </div>
            <input type="hidden" {...register("type")} />
            {errors.type && (
              <p className="text-destructive text-xs mt-1">{errors.type.message}</p>
            )}
          </div>

          {/* Initial Balance & Currency */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="value">
                Initial Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <input
                  type="number"
                  id="value"
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full pl-7 px-3 py-2 border rounded-md ${errors.value ? 'border-destructive' : ''}`}
                  {...register("value")}
                />
              </div>
              {errors.value && (
                <p className="text-destructive text-xs mt-1">{errors.value.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                For credit cards, enter a negative value for balance owed
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="currency">
                Currency
              </label>
              <select
                id="currency"
                className={`w-full px-3 py-2 border rounded-md ${errors.currency ? 'border-destructive' : ''}`}
                {...register("currency")}
              >
                {currencies.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
              {errors.currency && (
                <p className="text-destructive text-xs mt-1">{errors.currency.message}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="notes">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Any additional details about this account"
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
              {isSaving ? 'Saving...' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
