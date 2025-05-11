import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { formatCurrency } from "../../utils/format";

interface Account {
  id: string;
  name: string;
  type: string;
  current_value: number;
  transaction_total?: number;
}

interface AccountBalancesProps {
  accounts: Account[];
}

export function AccountBalances({ accounts }: AccountBalancesProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Account Balances</CardTitle>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No accounts found.</p>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{account.type}</p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-sm font-medium">
                    {formatCurrency(account.current_value)}
                  </p>
                  {account.transaction_total !== undefined && (
                    <p className={`text-xs ${account.transaction_total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {account.transaction_total >= 0 ? '+' : ''}{formatCurrency(account.transaction_total)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
