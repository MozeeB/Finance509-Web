"use client";

import { formatCurrency } from "@/utils/format";
import { PlusCircle, Filter, Download, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '@/utils/auth-service';
import { Transaction } from '@/types/database';

// Using the imported Transaction type from database.ts

// Simplified Account type for this component
type SimpleAccount = {
  id: string;
  name: string;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<SimpleAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

        // Fetch accounts for the add transaction link
        const { data: accountsData } = await supabase
          .from('accounts')
          .select('id, name, type, value, currency, created_at, user_id')
          .eq('user_id', user.id);
        
        // Create a simplified accounts array for the dropdown
        const simpleAccounts = (accountsData || []).map(acc => ({
          id: acc.id,
          name: acc.name
        }));
        
        setAccounts(simpleAccounts);
        
        // Fetch transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });
        
        console.log('Transactions Data:', transactionsData);
        console.log('Transactions Error:', transactionsError);
        
        // Create a map of account IDs to names
        const accountsMap = new Map();
        (accountsData || []).forEach(account => {
          accountsMap.set(account.id, account.name);
        });
        
        // Add account names to transactions
        const transactionsWithAccountNames = (transactionsData || []).map(transaction => ({
          ...transaction,
          account_name: accountsMap.get(transaction.account_id) || 'Unknown Account'
        }));
        
        setTransactions(transactionsWithAccountNames);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Encode accounts for the add transaction URL
  const encodedAccounts = encodeURIComponent(JSON.stringify(accounts));
  const addTransactionUrl = `/dashboard/transactions/add?accounts=${encodedAccounts}`;

  // Filter transactions
  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type.toLowerCase() === filter);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Transactions</h1>
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
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Link 
          href={addTransactionUrl} 
          className="mint-button flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Transaction
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-md text-sm ${
            filter === 'all' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          All
        </button>
        <button 
          onClick={() => setFilter('income')}
          className={`px-3 py-1.5 rounded-md text-sm ${
            filter === 'income' 
              ? 'bg-[hsl(var(--income))] text-white' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Income
        </button>
        <button 
          onClick={() => setFilter('expense')}
          className={`px-3 py-1.5 rounded-md text-sm ${
            filter === 'expense' 
              ? 'bg-[hsl(var(--expense))] text-white' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Expenses
        </button>
      </div>

      {/* Transactions Table */}
      <div className="mint-card overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Account</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr 
                    key={transaction.id} 
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link 
                        href={`/dashboard/transactions/${transaction.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {transaction.description}
                      </Link>
                      {transaction.notes && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {transaction.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-secondary">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {transaction.account_name}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${
                      transaction.type === 'Income' 
                        ? 'text-[hsl(var(--income))]' : 'text-[hsl(var(--expense))]'
                    }`}>
                      {formatCurrency(transaction.type === 'Income' 
                        ? Number(transaction.total) // For income, use the positive value
                        : -Math.abs(Number(transaction.total)) // For expense, ensure it's negative
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium">No transactions found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === 'all' 
                ? 'Add your first transaction to start tracking your finances.'
                : `No ${filter} transactions found. Try a different filter.`}
            </p>
            {filter === 'all' && (
              <div className="mt-4">
                <Link 
                  href={addTransactionUrl} 
                  className="mint-button inline-flex items-center gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Transaction
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
