import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { formatCurrency } from "../../utils/format";

interface EmergencyFundProps {
  goalAmount: number;
  currentAmount: number;
  targetMonths: number;
  notes?: string;
}

export function EmergencyFund({ 
  goalAmount, 
  currentAmount, 
  targetMonths,
  notes 
}: EmergencyFundProps) {
  const percentage = Math.round((currentAmount / goalAmount) * 100);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Fund</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Progress</p>
            <p className="text-sm font-medium">{percentage}%</p>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>Current: {formatCurrency(currentAmount)}</p>
            <p>Goal: {formatCurrency(goalAmount)}</p>
          </div>
          <div className="rounded-md bg-muted p-2">
            <p className="text-xs">Target: {targetMonths} months of expenses</p>
            {notes && <p className="text-xs mt-1">{notes}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
