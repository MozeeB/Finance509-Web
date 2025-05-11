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
  category: z.string().min(1, { message: "Category is required" }),
  budget_amount: z.coerce.number().min(0.01, { message: "Budget amount must be greater than 0" }),
  start_date: z.string().min(1, { message: "Start date is required" }),
  end_date: z.string().min(1, { message: "End date is required" }),
  notes: z.string().optional(),
});

export default function AddBudgetPage() {
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
            description: "Please sign in to create a budget",
            variant: "destructive"
          });
          router.push('/sign-in?returnUrl=/protected/budgets/add');
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
        router.push('/sign-in?returnUrl=/protected/budgets/add');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [supabase, router, toast]);
  
  // Get first and last day of current month for default values
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  // Common expense categories
  const categories = [
    "Food", "Transportation", "Housing", "Utilities", 
    "Entertainment", "Healthcare", "Education", "Shopping",
    "Personal Care", "Debt Payments", "Savings", "Investments",
    "Gifts & Donations", "Travel", "Miscellaneous"
  ];
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      budget_amount: 0,
      start_date: firstDay,
      end_date: lastDay,
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
          description: "Please sign in to create a budget",
          variant: "destructive"
        });
        router.push('/sign-in?returnUrl=/protected/budgets/add');
        return;
      }
      
      // Insert budget with user_id
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          category: values.category,
          budget_amount: values.budget_amount,
          start_date: values.start_date,
          end_date: values.end_date,
          notes: values.notes || null,
          user_id: user.id, // Associate with current user
        })
        .select();
        
      if (error) throw error;
      
      toast({
        title: "Budget created",
        description: "Your budget has been successfully created.",
      });
      
      router.push('/protected/budgets');
      router.refresh();
    } catch (error) {
      console.error('Error adding budget:', error);
      toast({
        title: "Error",
        description: "There was a problem creating your budget. Please try again.",
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
          <p className="text-muted-foreground mb-6">Please sign in to create a budget</p>
          <Link href="/sign-in?returnUrl=/protected/budgets/add" className="mint-button inline-flex">
            Sign In
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center gap-2">
        <Link href="/protected/budgets" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Add Budget</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Budget Details</CardTitle>
          <CardDescription>
            Create a new budget to track your spending in a specific category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="" disabled>Select a category</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="budget_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Amount</FormLabel>
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
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <Input placeholder="Any additional notes about this budget" {...field} />
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
                  {isSubmitting ? "Creating..." : "Create Budget"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
