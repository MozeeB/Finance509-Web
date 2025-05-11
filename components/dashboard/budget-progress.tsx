import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { formatCurrency } from "../../utils/format";

interface Budget {
  id: string;
  category: string;
  budget_amount: number;
  spent_amount: number;
  percentage: number;
}

interface BudgetProgressProps {
  budgets: Budget[];
}

export function BudgetProgress({ budgets }: BudgetProgressProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Budget Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No budgets found.</p>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{budget.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(budget.spent_amount)} of {formatCurrency(budget.budget_amount)}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {budget.percentage}%
                  </p>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${
                      budget.percentage > 90
                        ? "bg-red-500"
                        : budget.percentage > 75
                        ? "bg-amber-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
