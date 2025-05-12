"use client";

import { formatCurrency } from "@/utils/format";
import { PiggyBank, Edit } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '@/utils/auth-service';
import { EmergencyFund, Transaction } from '@/types/database';

// Using the imported EmergencyFund type from database.ts

export default function EmergencyFundPage() {
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClientComponentClient();
        
        // Get user using auth-service
        const { success, user } = await getCurrentUser();
        
        if (!success || !user) {
          setIsLoading(false);
          return;
        }

        // Fetch emergency fund records
        const { data: emergencyFundData, error: emergencyFundError } = await supabase
          .from('emergency_fund')
          .select('*')
          .order('created_at', { ascending: false });
        
        console.log('Emergency Fund Data:', emergencyFundData);
        console.log('Emergency Fund Error:', emergencyFundError);
        
        // Use the most recent emergency fund record if available
        if (emergencyFundData && emergencyFundData.length > 0) {
          // Use the first record (most recent one based on our ordering)
          setEmergencyFund(emergencyFundData[0]);
        } else {
          setEmergencyFund(null);
        }
        
        // Calculate monthly expenses for context
        const { data: transactions } = await supabase
          .from('transactions')
          .select('total')
          .eq('type', 'expense') // Using lowercase to match database values
          .gte('date', new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString())
          .lte('date', new Date().toISOString());
        
        // Average monthly expenses over the last 3 months
        const totalExpenses = (transactions || []).reduce((sum, t) => sum + Math.abs(t.total), 0);
        const avgMonthlyExpenses = totalExpenses / 3;
        
        setMonthlyExpenses(avgMonthlyExpenses);
      } catch (error) {
        console.error('Error fetching emergency fund:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Calculate progress percentage
  const progressPercentage = emergencyFund 
    ? Math.min(Math.round((Number(emergencyFund.current_amount) / Number(emergencyFund.goal_amount)) * 100), 100) 
    : 0;
  
  // Calculate months of expenses covered
  const monthsCovered = monthlyExpenses > 0 && emergencyFund 
    ? Math.round((Number(emergencyFund.current_amount) / monthlyExpenses) * 10) / 10 
    : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Emergency Fund</h1>
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
        <h1 className="text-2xl font-bold">Emergency Fund</h1>
        <Link 
          href="/dashboard/emergency-fund/edit" 
          className="mint-button flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          {emergencyFund ? 'Edit Fund' : 'Set Up Fund'}
        </Link>
      </div>

      {emergencyFund ? (
        <>
          {/* Emergency Fund Overview */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="mint-card p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <PiggyBank className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Emergency Fund</h2>
                  <p className="text-sm text-muted-foreground">
                    {emergencyFund.target_months} months of expenses
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Current Amount</span>
                    <span className="text-xl font-bold">{formatCurrency(Number(emergencyFund.current_amount))}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Goal Amount</span>
                    <span className="text-lg font-medium">{formatCurrency(Number(emergencyFund.goal_amount))}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="text-sm font-medium">{progressPercentage}%</span>
                  </div>
                  
                  <div className="mint-progress mb-2">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  
                  <p className="text-sm text-center">
                    {formatCurrency(Number(emergencyFund.goal_amount) - Number(emergencyFund.current_amount))} left to reach your goal
                  </p>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Based on your average monthly expenses of {formatCurrency(monthlyExpenses)}, your emergency fund currently covers:
                  </p>
                  <div className="text-2xl font-bold text-center">
                    {monthsCovered} months
                  </div>
                  <p className="text-sm text-center text-muted-foreground mt-1">
                    {monthsCovered >= emergencyFund.target_months 
                      ? 'You\'ve reached your goal! 🎉' 
                      : `${(emergencyFund.target_months - monthsCovered).toFixed(1)} more months to reach your ${emergencyFund.target_months}-month goal`}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mint-card p-6">
              <h3 className="text-lg font-medium mb-4">Why Have an Emergency Fund?</h3>
              <div className="space-y-4 text-sm">
                <p>
                  An emergency fund is money you set aside to cover unexpected expenses or financial emergencies, such as:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Medical emergencies</li>
                  <li>Major car repairs</li>
                  <li>Unexpected home repairs</li>
                  <li>Job loss or reduced income</li>
                  <li>Unplanned travel expenses</li>
                </ul>
                <p>
                  Financial experts typically recommend having 3-6 months of essential expenses saved in your emergency fund.
                </p>
                <div className="bg-primary/10 p-4 rounded-lg mt-4">
                  <h4 className="font-medium mb-2">Tips for Building Your Fund</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Start small with a goal of $1,000</li>
                    <li>Set up automatic transfers to your emergency fund</li>
                    <li>Use windfalls like tax refunds to boost your fund</li>
                    <li>Keep your emergency fund in a separate, easily accessible account</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="mint-card p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <PiggyBank className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium mb-2">No Emergency Fund Set Up</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            An emergency fund is an essential part of your financial health. It provides a safety net for unexpected expenses and peace of mind.
          </p>
          <Link 
            href="/dashboard/emergency-fund/edit"
            className="mint-button inline-flex items-center gap-2"
          >
            Set Up Your Emergency Fund
          </Link>
        </div>
      )}
    </div>
  );
}
