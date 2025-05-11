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
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  goal_amount: z.coerce.number().min(0.01, { message: "Goal amount must be greater than 0" }),
  current_amount: z.coerce.number().min(0, { message: "Current amount must be 0 or greater" }),
  target_months: z.coerce.number().min(1, { message: "Target months must be at least 1" }),
  notes: z.string().optional(),
});

export default function EditEmergencyFundPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fundExists, setFundExists] = useState(false);
  const supabase = createClientComponentClient();
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goal_amount: 0,
      current_amount: 0,
      target_months: 6,
      notes: "",
    },
  });

  // Fetch existing emergency fund data if it exists
  useEffect(() => {
    async function fetchEmergencyFund() {
      try {
        const { data, error } = await supabase
          .from('emergency_fund')
          .select('*')
          .single();
          
        if (!error && data) {
          form.reset({
            goal_amount: data.goal_amount,
            current_amount: data.current_amount,
            target_months: data.target_months,
            notes: data.notes || "",
          });
          setFundExists(true);
        }
      } catch (error) {
        console.error('Error fetching emergency fund:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEmergencyFund();
  }, [supabase, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      if (fundExists) {
        // Update existing emergency fund
        const { error } = await supabase
          .from('emergency_fund')
          .update({
            goal_amount: values.goal_amount,
            current_amount: values.current_amount,
            target_months: values.target_months,
            notes: values.notes || null,
          })
          .eq('id', (await supabase.from('emergency_fund').select('id').single()).data.id);
          
        if (error) throw error;
        
        toast({
          title: "Emergency Fund updated",
          description: "Your emergency fund has been successfully updated.",
        });
      } else {
        // Insert new emergency fund
        const { error } = await supabase
          .from('emergency_fund')
          .insert({
            goal_amount: values.goal_amount,
            current_amount: values.current_amount,
            target_months: values.target_months,
            notes: values.notes || null,
          });
          
        if (error) throw error;
        
        toast({
          title: "Emergency Fund created",
          description: "Your emergency fund has been successfully created.",
        });
      }
      
      router.push('/protected/emergency-fund');
      router.refresh();
    } catch (error) {
      console.error('Error saving emergency fund:', error);
      toast({
        title: "Error",
        description: "There was a problem saving your emergency fund. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex items-center gap-2">
          <Link href="/protected/emergency-fund" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">Emergency Fund</h1>
        </div>
        <div className="text-center py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center gap-2">
        <Link href="/protected/emergency-fund" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">{fundExists ? "Edit" : "Set Up"} Emergency Fund</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Emergency Fund Details</CardTitle>
          <CardDescription>
            {fundExists 
              ? "Update your emergency fund details below." 
              : "Set up your emergency fund to prepare for unexpected expenses."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="goal_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Amount</FormLabel>
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
                
                <FormField
                  control={form.control}
                  name="current_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Amount</FormLabel>
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
              
              <FormField
                control={form.control}
                name="target_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Months of Expenses</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="1" 
                        min="1"
                        placeholder="6"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes about your emergency fund goals"
                        className="min-h-[100px]"
                        {...field}
                      />
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : (fundExists ? "Update" : "Create")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
