import { createClient } from "@/utils/supabase/server";
import { formatCurrency } from "@/utils/format";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

export default async function AccountsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

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
      created_at
    `)
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  // Group accounts by type
  const accountsByType: Record<string, any[]> = {};
  
  accounts?.forEach(account => {
    if (!accountsByType[account.type]) {
      accountsByType[account.type] = [];
    }
    accountsByType[account.type].push(account);
  });

  // Calculate totals
  const totalAssets = accounts
    ?.filter(a => a.value > 0)
    .reduce((sum, account) => sum + account.value, 0) || 0;
    
  const totalLiabilities = accounts
    ?.filter(a => a.value < 0)
    .reduce((sum, account) => sum + account.value, 0) || 0;
    
  const netWorth = totalAssets + totalLiabilities;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <Link 
          href="/protected/accounts/add" 
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <PlusCircle className="h-4 w-4" />
          Add Account
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Assets</div>
          <div className="mt-1 text-2xl font-bold text-green-500">{formatCurrency(totalAssets)}</div>
        </div>
        
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Liabilities</div>
          <div className="mt-1 text-2xl font-bold text-red-500">{formatCurrency(totalLiabilities)}</div>
        </div>
        
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Net Worth</div>
          <div className={`mt-1 text-2xl font-bold ${netWorth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(netWorth)}
          </div>
        </div>
      </div>

      {/* Accounts by Type */}
      <div className="space-y-6">
        {Object.entries(accountsByType).map(([type, accounts]) => (
          <div key={type} className="space-y-3">
            <h2 className="text-xl font-semibold">{type} Accounts</h2>
            <div className="rounded-md border">
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
                          account.value >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {formatCurrency(account.value, account.currency)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Link 
                              href={`/protected/accounts/edit/${account.id}`}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                            <Link 
                              href={`/protected/accounts/delete/${account.id}`}
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
          <div className="rounded-md border p-8 text-center">
            <h3 className="text-lg font-medium">No accounts found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first account to start tracking your finances.
            </p>
            <div className="mt-4">
              <Link 
                href="/protected/accounts/add" 
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
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
