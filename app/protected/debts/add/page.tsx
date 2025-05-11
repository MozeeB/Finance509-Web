"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const formSchema = z.object({
  name: z.string().min(1, { message: "Debt name is required" }),
  amount: z.coerce.number().min(0.01, { message: "Amount must be greater than 0" }),
  interest_rate: z.coerce.number().min(0, { message: "Interest rate must be 0 or greater" }),
  min_payment: z.coerce.number().min(0, { message: "Minimum payment must be 0 or greater" }),
  due_date: z.string().min(1, { message: "Due date is required" }),
  strategy: z.enum(["Avalanche", "Snowball"], { 
    required_error: "Please select a repayment strategy" 
  }),
  notes: z.string().optional(),
});

export default function AddDebtPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClientComponentClient();
  
  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.error('Authentication error:', error?.message || 'User not found');
          toast({
            title: "Authentication Required",
            description: "Please sign in to add a debt",
            variant: "destructive"
          });
          router.push('/sign-in?returnUrl=/protected/debts/add');
          return;
        }
        
        setUser(user);
      } catch (err) {
        console.error('Error checking authentication:', err);
        toast({
          title: "Error",
          description: "Failed to verify authentication. Please try signing in again.",
          variant: "destructive"
        });
        router.push('/sign-in?returnUrl=/protected/debts/add');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [supabase, router, toast]);
  
  // Get today's date for default value
  const today = new Date();
  const defaultDueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15).toISOString().split('T')[0];
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: 0,
      interest_rate: 0,
      min_payment: 0,
      due_date: defaultDueDate,
      strategy: "Avalanche",
      notes: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      // Make sure user is authenticated
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to add a debt",
          variant: "destructive"
        });
        router.push('/sign-in?returnUrl=/protected/debts/add');
        return;
      }
      
      // Insert debt with user_id
      const { data, error } = await supabase
        .from('debts')
        .insert({
          name: values.name,
          amount: values.amount,
          interest_rate: values.interest_rate,
          min_payment: values.min_payment,
          due_date: values.due_date,
          strategy: values.strategy,
          notes: values.notes || null,
          user_id: user.id, // Associate with current user
        })
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Debt added",
        description: "Your debt has been successfully recorded.",
      });
      
      router.push('/protected/debts');
      router.refresh();
    } catch (error) {
      console.error('Error adding debt:', error);
      toast({
        title: "Error",
        description: "There was a problem adding your debt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 items-center justify-center min-h-[300px]">
        <div className="mint-card p-8 text-center">
          <div className="animate-pulse mb-4">
            <div className="h-8 w-8 rounded-full bg-primary/20 mx-auto"></div>
          </div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 items-center justify-center min-h-[300px]">
        <div className="mint-card p-8 text-center">
          <p className="text-lg font-medium mb-4">Authentication Required</p>
          <p className="text-muted-foreground mb-6">Please sign in to add a debt</p>
          <Link href="/sign-in?returnUrl=/protected/debts/add" className="mint-button inline-flex">
            Sign In
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center gap-2">
        <Link href="/protected/debts" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Add Debt</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Debt Details</CardTitle>
          <CardDescription>
            Enter the details of your debt below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Debt Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Student Loan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="interest_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interest Rate (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="min_payment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Payment</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="strategy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repayment Strategy</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="Avalanche">Avalanche (Highest Interest First)</option>
                          <option value="Snowball">Snowball (Smallest Balance First)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Any additional notes about this debt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="mint-button">
                  {isSubmitting ? "Adding..." : "Add Debt"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
