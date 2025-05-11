import { createClient } from "@/utils/supabase/server";
import { formatCurrency } from "@/utils/format";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { Account, Transaction } from "@/types/database";

export default async function TransactionsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // Handle case where user is not authenticated
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Authentication Required</h1>
        <p className="mt-2">Please sign in to view your transactions.</p>
        <Link href="/sign-in" className="mint-button inline-block mt-4">Sign In</Link>
      </div>
    );
  }

  // Fetch accounts for the current user
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('name');

  // Fetch transactions for the current user's accounts
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      id,
      date,
      month,
      account_id,
      type,
      category,
      description,
      total,
      created_at,
      accounts(id, name)
    `)
    .in('account_id', accounts?.map((account: Account) => account.id) || [])
    .order('date', { ascending: false })
    .limit(50);
    
  // Encode accounts for URL params
  const encodedAccounts = encodeURIComponent(JSON.stringify(accounts || []));
  const addTransactionUrl = `/protected/transactions/add?accounts=${encodedAccounts}`;

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all your financial transactions
          </p>
        </div>
        <Link 
          href={addTransactionUrl} 
          className="mint-button flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Transaction
        </Link>
      </div>

      <div className="mint-card overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">All Transactions</h3>
          <div className="flex items-center gap-2">
            {/* Filter options could be added here */}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">Account</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">Description</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">Category</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">Type</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground text-sm">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions && transactions.length > 0 ? (
                transactions.map((transaction: any) => (
                  <tr 
                    key={transaction.id} 
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">{new Date(transaction.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm">
                      {transaction.accounts ? 
                        (typeof transaction.accounts === 'object' && transaction.accounts !== null && 'name' in transaction.accounts ? 
                          String(transaction.accounts.name) : '') : 
                        ''}                        
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{transaction.description}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-secondary">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${transaction.type === 'Income' ? 'bg-[hsl(var(--income))/10] text-[hsl(var(--income))]' : 'bg-[hsl(var(--expense))/10] text-[hsl(var(--expense))]'}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium text-right ${transaction.type === 'Income' ? 'income-text' : 'expense-text'}`}>
                      {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.total))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <p>No transactions found.</p>
                      <Link 
                        href={addTransactionUrl} 
                        className="text-primary hover:underline text-sm"
                      >
                        Add your first transaction to get started
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
