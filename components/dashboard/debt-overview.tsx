import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { formatCurrency } from "../../utils/format";

interface Debt {
  id: string;
  name: string;
  amount: number;
  interest_rate: number;
  min_payment: number;
  due_date: string;
  strategy: string;
}

interface DebtOverviewProps {
  debts: Debt[];
}

export function DebtOverview({ debts }: DebtOverviewProps) {
  // Sort debts by due date (closest first)
  const sortedDebts = [...debts].sort((a, b) => 
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Debt Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedDebts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No debts found.</p>
        ) : (
          <div className="space-y-4">
            {sortedDebts.map((debt) => {
              // We'll handle due date display client-side to avoid hydration errors
              // This calculation will be done on the client
              
              return (
                <div key={debt.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{debt.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {debt.interest_rate}% • {debt.strategy}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-sm font-medium">{formatCurrency(debt.amount)}</p>
                    <p className="text-xs" suppressHydrationWarning>
                      Due: {debt.due_date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
