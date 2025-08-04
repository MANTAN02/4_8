import { useQuery } from '@tanstack/react-query';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CustomerBalance, BCoinTransaction } from '@shared/schema';

interface BCoinBalanceProps {
  customerId: string;
}

export function BCoinBalance({ customerId }: BCoinBalanceProps) {
  const { data: balance, isLoading: balanceLoading } = useQuery<CustomerBalance>({
    queryKey: ['/api/customer/balance', customerId],
  });

  const { data: recentTransactions = [], isLoading: transactionsLoading } = useQuery<BCoinTransaction[]>({
    queryKey: ['/api/customer/transactions', customerId],
  });

  const recentTxns = recentTransactions.slice(0, 3);
  const totalBCoins = balance ? parseFloat(balance.totalBCoins) : 0;

  if (balanceLoading) {
    return (
      <Card data-testid="bcoin-balance-card">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" data-testid="bcoin-balance-card">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
        <CardTitle className="flex items-center gap-2">
          <Coins className="w-6 h-6" />
          B-Coin Balance
        </CardTitle>
        <CardDescription className="text-orange-100">
          Your loyalty rewards balance
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-balance">
              ₹{totalBCoins.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">Available B-Coins</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            Active
          </Badge>
        </div>

        {recentTxns.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Activity</h4>
            {transactionsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {recentTxns.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    data-testid={`transaction-${txn.id}`}
                  >
                    <div className="flex items-center gap-2">
                      {txn.type === 'earned' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {txn.type === 'earned' ? 'Earned' : 'Redeemed'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-32">
                          {txn.description}
                        </p>
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${
                      txn.type === 'earned' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {txn.type === 'earned' ? '+' : '-'}₹{Math.abs(parseFloat(txn.bCoinsChanged)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}