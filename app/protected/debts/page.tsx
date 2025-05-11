import { createClient } from "@/utils/supabase/server";
import { formatCurrency } from "@/utils/format";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default async function DebtsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch debts
  const { data: debts } = await supabase
    .from('debts')
    .select('*')
    .order('due_date', { ascending: true });

  // Calculate total debt
  const totalDebt = debts?.reduce((sum, debt) => sum + debt.amount, 0) || 0;

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold">Debts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage all your loans and liabilities
          </p>
        </div>
        <Link 
          href="/protected/debts/add" 
          className="mint-button flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Add Debt
        </Link>
      </div>

      <div className="mint-card mb-2">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-lg font-medium text-muted-foreground">Total Debt</h2>
            <p className="text-3xl font-bold mt-2 expense-text">{formatCurrency(totalDebt)}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-auto">
            <div className="mint-card bg-secondary/30 p-4 text-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mx-auto mb-2">
                <span className="text-xs font-bold">A</span>
              </div>
              <p className="font-medium">Avalanche</p>
              <p className="text-xs text-muted-foreground mt-1">Pay highest interest first</p>
            </div>
            <div className="mint-card bg-secondary/30 p-4 text-center">
              <div className="h-10 w-10 rounded-full bg-green-100 text-green-800 flex items-center justify-center mx-auto mb-2">
                <span className="text-xs font-bold">S</span>
              </div>
              <p className="font-medium">Snowball</p>
              <p className="text-xs text-muted-foreground mt-1">Pay smallest balance first</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mint-card overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">All Debts</h3>
          <div className="flex items-center gap-2">
            {/* Filter options could be added here */}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">Name</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground text-sm">Amount</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground text-sm">Interest Rate</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground text-sm">Min Payment</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">Due Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-sm">Strategy</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {debts && debts.length > 0 ? (
                debts.map((debt) => (
                  <tr 
                    key={debt.id} 
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium">{debt.name}</td>
                    <td className="px-4 py-3 text-sm text-right expense-text font-medium">{formatCurrency(debt.amount)}</td>
                    <td className="px-4 py-3 text-sm text-right">{debt.interest_rate}%</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(debt.min_payment)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs bg-secondary">
                        {new Date(debt.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        debt.strategy === 'Avalanche' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {debt.strategy}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <Link 
                        href={`/protected/debts/${debt.id}`} 
                        className="text-primary hover:underline text-xs"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <PlusCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium mb-1">No debts found</p>
                        <p className="text-sm mb-4">Add your first debt to get started</p>
                        <Link 
                          href="/protected/debts/add" 
                          className="mint-button inline-flex items-center gap-2"
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add Debt
                        </Link>
                      </div>
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
