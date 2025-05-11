import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { formatCurrency } from "../../utils/format";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  total: number;
  type: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent transactions found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center rounded-lg border p-3"
                >
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {transaction.date} • {transaction.category}
                    </p>
                  </div>
                  <div className={`font-medium ${transaction.type === 'Income' ? 'text-green-500' : 'text-red-500'}`}>
                    {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.total))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
