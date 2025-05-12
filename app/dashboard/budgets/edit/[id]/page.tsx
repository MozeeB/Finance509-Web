"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EditBudgetForm from './budget-form';
import { Budget } from '@/types/database';

// This is a client component that fetches the initial data
export default function EditBudgetPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const budgetId = params.id;
  const [budgetData, setBudgetData] = useState<Budget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Create a Supabase client for the client component
        const supabase = createClientComponentClient();
        
        // Fetch the budget data
        const { data: budgetData, error: budgetError } = await supabase
          .from('budgets')
          .select('*')
          .eq('id', budgetId)
          .single();
        
        if (budgetError || !budgetData) {
          // If budget not found, redirect to budgets page
          router.push('/dashboard/budgets');
          return;
        }
        
        setBudgetData(budgetData as Budget);
        
        // Fetch categories from transactions
        const { data: transactionsData } = await supabase
          .from('transactions')
          .select('category')
          .not('category', 'is', null);
          
        // Fetch categories from budgets
        const { data: budgetsData } = await supabase
          .from('budgets')
          .select('category');
          
        // Extract unique categories
        const transactionCategories = (transactionsData || []).map((t: any) => t.category);
        const budgetCategories = (budgetsData || []).map((b: any) => b.category);
        
        // Combine and deduplicate categories
        const categories = Array.from(
          new Set([...transactionCategories, ...budgetCategories])
        ).filter(Boolean) as string[];
        
        // Add default categories if needed
        if (categories.length === 0) {
          categories.push(
            'Housing',
            'Utilities',
            'Food',
            'Transportation',
            'Healthcare',
            'Entertainment',
            'Personal',
            'Education',
            'Savings',
            'Debt',
            'Miscellaneous'
          );
        }
        
        setUniqueCategories(categories);
      } catch (error: any) {
        console.error('Error fetching budget data:', error);
        setError('Failed to load budget data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [budgetId, router]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard/budgets" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Budgets
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-6">Edit Budget</h1>
        <div className="mint-card p-6 text-center">
          <p>Loading budget data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard/budgets" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Budgets
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-6">Edit Budget</h1>
        <div className="mint-card p-6">
          <p className="text-destructive">{error}</p>
          <Link href="/dashboard/budgets" className="mint-button mt-4 inline-block">
            Return to Budgets
          </Link>
        </div>
      </div>
    );
  }
  
  // If we have budget data, render the form
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard/budgets" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Budgets
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">Edit Budget</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pass the client-fetched data to the form component */}
        {budgetData && (
          <EditBudgetForm 
            budgetId={budgetId} 
            initialBudget={budgetData} 
            categories={uniqueCategories} 
          />
        )}

        <div className="mint-card p-6">
          <h2 className="text-lg font-medium mb-4">Budget Tips</h2>
          
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-primary/10 rounded-lg">
              <h3 className="font-medium mb-1">50/30/20 Rule</h3>
              <p>Allocate 50% of your income to needs, 30% to wants, and 20% to savings and debt repayment.</p>
            </div>
            
            <div className="p-3 bg-primary/10 rounded-lg">
              <h3 className="font-medium mb-1">Zero-Based Budgeting</h3>
              <p>Assign every dollar a job so your income minus expenses equals zero.</p>
            </div>
            
            <div className="p-3 bg-primary/10 rounded-lg">
              <h3 className="font-medium mb-1">Common Budget Categories</h3>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Housing: Rent/mortgage, insurance, property tax</li>
                <li>Utilities: Electricity, water, gas, internet</li>
                <li>Food: Groceries, dining out</li>
                <li>Transportation: Gas, car payment, public transit</li>
                <li>Health: Insurance, medications, gym membership</li>
                <li>Entertainment: Streaming services, hobbies, events</li>
                <li>Personal: Clothing, haircuts, personal care</li>
                <li>Savings: Emergency fund, retirement, goals</li>
                <li>Debt: Credit cards, student loans, personal loans</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
