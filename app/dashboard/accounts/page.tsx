"use client";

import { formatCurrency } from "@/utils/format";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentUser } from '@/utils/auth-service';
import { Account } from '@/types/database';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsByType, setAccountsByType] = useState<Record<string, Account[]>>({});
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [netWorth, setNetWorth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const supabase = createClientComponentClient();
        
        // Get user using auth-service
        const { success, user } = await getCurrentUser();
        
        if (!success || !user) {
          setIsLoading(false);
          return;
        }

        // Fetch accounts
        const { data: accounts } = await supabase
          .from('accounts')
          .select(`
            id,
            name,
            type,
            value,
            currency,
            notes,
            created_at,
            user_id
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        setAccounts(accounts || []);
        
        // Group accounts by type
        const groupedAccounts: Record<string, any[]> = {};
        
        accounts?.forEach(account => {
          if (!groupedAccounts[account.type]) {
            groupedAccounts[account.type] = [];
          }
          groupedAccounts[account.type].push(account);
        });
        
        setAccountsByType(groupedAccounts);
        
        // Calculate totals
        const assets = accounts
          ?.filter(a => a.value > 0)
          .reduce((sum, account) => sum + account.value, 0) || 0;
          
        const liabilities = accounts
          ?.filter(a => a.value < 0)
          .reduce((sum, account) => sum + account.value, 0) || 0;
          
        setTotalAssets(assets);
        setTotalLiabilities(liabilities);
        setNetWorth(assets + liabilities);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAccounts();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Accounts</h1>
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
        <h1 className="text-2xl font-bold">Accounts</h1>
        <Link 
          href="/dashboard/accounts/add" 
          className="mint-button flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Account
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="mint-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Assets</div>
          <div className="mt-1 text-2xl font-bold text-[hsl(var(--income))]">+{formatCurrency(totalAssets)}</div>
        </div>
        
        <div className="mint-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Liabilities</div>
          <div className="mt-1 text-2xl font-bold text-[hsl(var(--expense))]">-{formatCurrency(Math.abs(totalLiabilities))}</div>
        </div>
        
        <div className="mint-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Net Worth</div>
          <div className={`mt-1 text-2xl font-bold ${netWorth >= 0 ? 'text-[hsl(var(--income))]' : 'text-[hsl(var(--expense))]'}`}>
            {netWorth >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netWorth))}
          </div>
        </div>
      </div>

      {/* Accounts by Type */}
      <div className="space-y-6">
        {Object.entries(accountsByType).map(([type, accounts]) => (
          <div key={type} className="space-y-3">
            <h2 className="text-xl font-semibold">{type} Accounts</h2>
            <div className="mint-card overflow-hidden">
              <div className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Notes</th>
                      <th className="px-4 py-3 text-right font-medium">Balance</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((account) => (
                      <tr 
                        key={account.id} 
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-left font-medium">{account.name}</td>
                        <td className="px-4 py-3 text-left text-muted-foreground">{account.notes || '-'}</td>
                        <td className={`px-4 py-3 text-right font-medium ${
                          account.value >= 0 ? 'income-text' : 'expense-text'
                        }`}>
                          {formatCurrency(account.value, account.currency)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Link 
                              href={`/dashboard/accounts/edit/${account.id}`}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                            <Link 
                              href={`/dashboard/accounts/delete/${account.id}`}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}

        {Object.keys(accountsByType).length === 0 && (
          <div className="mint-card p-8 text-center">
            <h3 className="text-lg font-medium">No accounts found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first account to start tracking your finances.
            </p>
            <div className="mt-4">
              <Link 
                href="/dashboard/accounts/add" 
                className="mint-button inline-flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Add Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
