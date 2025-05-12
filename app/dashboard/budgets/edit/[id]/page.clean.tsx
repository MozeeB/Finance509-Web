import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EditBudgetForm from './edit-budget-form';
import { Budget } from '@/types/database';

interface PageProps {
  params: { id: string };
}

// This is a server component that fetches the initial data
export default async function EditBudgetPage({ params }: PageProps) {
  const budgetId = params.id;
  
  // Create a Supabase client for the server component
  const supabase = createServerComponentClient({ cookies });
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/sign-in');
  }
  
  // Fetch the budget data
  const { data: budgetData, error: budgetError } = await supabase
    .from('budgets')
    .select('*')
    .eq('id', budgetId)
    .single();
  
  if (budgetError || !budgetData) {
    // If budget not found, redirect to budgets page
    redirect('/dashboard/budgets');
  }
  
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
  const uniqueCategories = Array.from(
    new Set([...transactionCategories, ...budgetCategories])
  ).filter(Boolean) as string[];
  
  // Add default categories if needed
  if (uniqueCategories.length === 0) {
    uniqueCategories.push(
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
        {/* Pass the server-fetched data to the client component */}
        <EditBudgetForm 
          budgetId={budgetId} 
          initialBudget={budgetData as Budget} 
          categories={uniqueCategories} 
        />

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
