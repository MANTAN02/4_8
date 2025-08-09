import { useState } from 'react';
import { BarChart3, Users, QrCode, Star, TrendingUp, Bell, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/NotificationCenter';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Business, BCoinTransaction, QrCode as QrCodeType, Rating } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';

export default function EnhancedBusinessDashboard() {
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: user } = useAuth();
  const { isConnected } = useWebSocket();
  const queryClient = useQueryClient();

  const { data: business, isLoading: businessLoading } = useQuery<Business>({
    queryKey: ['/api/business/profile'],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<BCoinTransaction[]>({
    queryKey: ['/api/business/transactions'],
  });

  const { data: qrCodes = [], isLoading: qrCodesLoading } = useQuery<QrCodeType[]>({
    queryKey: ['/api/business/qr-codes'],
  });

  const { data: ratings = [], isLoading: ratingsLoading } = useQuery<Rating[]>({
    queryKey: ['/api/business/ratings'],
  });

  const generateQRMutation = useMutation({
    mutationFn: (data: { amount: number; description: string }) =>
      apiRequest('/api/qr-codes', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business/qr-codes'] });
    },
  });

  // Calculate metrics
  const recentTransactions = transactions.slice(0, 5);
  const totalRevenue = transactions.reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
  const totalCustomers = new Set(transactions.map(txn => txn.customerId)).size;
  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
    : 0;
  const monthlyGrowth = 12.5; // Calculate actual growth

  const handleGenerateQR = () => {
    generateQRMutation.mutate({
      amount: 100,
      description: 'Purchase reward',
    });
  };

  if (!user || businessLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {business?.businessName || 'Business Dashboard'} 🏪
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your business and track customer engagement
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              isConnected 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? 'Live' : 'Offline'}
            </div>

            {/* Business Status */}
            <Badge 
              variant={business?.isVerified ? 'default' : 'secondary'}
              className={business?.isVerified ? 'bg-green-600' : ''}
            >
              {business?.isVerified ? '✓ Verified' : 'Pending Verification'}
            </Badge>

            {/* Notifications */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotifications(true)}
              data-testid="button-notifications"
            >
              <Bell className="w-4 h-4" />
            </Button>

            {/* Settings */}
            <Button
              variant="outline"
              size="sm"
              data-testid="button-settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Metrics Cards */}
          <div className="lg:col-span-4 grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card data-testid="card-revenue">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <TrendingUp className="w-3 h-3" />
                  +{monthlyGrowth}% from last month
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-customers">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{totalCustomers}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Users className="w-3 h-3" />
                  Unique customers served
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-rating">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {averageRating > 0 ? averageRating.toFixed(1) : '—'}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Star className="w-3 h-3" />
                  From {ratings.length} reviews
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-qr-codes">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active QR Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {qrCodes.filter(qr => !qr.isUsed).length}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <QrCode className="w-3 h-3" />
                  Ready for scanning
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Left Column - QR Codes & Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card data-testid="card-quick-actions">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleGenerateQR}
                  disabled={generateQRMutation.isPending}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  data-testid="button-generate-qr"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generate QR Code
                </Button>
                
                <Button variant="outline" className="w-full" data-testid="button-view-analytics">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            {/* Recent QR Codes */}
            <Card data-testid="card-recent-qr">
              <CardHeader>
                <CardTitle className="text-lg">Recent QR Codes</CardTitle>
                <CardDescription>
                  Latest generated QR codes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {qrCodesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : qrCodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No QR codes generated yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {qrCodes.slice(0, 5).map((qr) => (
                      <div
                        key={qr.id}
                        className="p-3 border rounded-lg"
                        data-testid={`qr-code-${qr.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">₹{qr.amount}</span>
                          <Badge variant={qr.isUsed ? 'secondary' : 'default'}>
                            {qr.isUsed ? 'Used' : 'Active'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {qr.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(qr.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Recent Transactions */}
            <Card data-testid="card-recent-transactions">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>
                  Latest B-Coin transactions from customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : recentTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No transactions yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        data-testid={`transaction-${transaction.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <span className="text-green-600 dark:text-green-400">🪙</span>
                          </div>
                          <div>
                            <p className="font-medium">B-Coins {transaction.type}</p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">
                            +₹{transaction.bCoinsChanged}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Purchase: ₹{transaction.amount}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Ratings */}
            <Card data-testid="card-customer-ratings">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  Customer Reviews
                </CardTitle>
                <CardDescription>
                  Recent feedback from your customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ratingsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : ratings.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No reviews yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ratings.slice(0, 5).map((rating) => (
                      <div
                        key={rating.id}
                        className="p-4 border rounded-lg"
                        data-testid={`rating-${rating.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= rating.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {rating.review && (
                          <p className="text-sm text-muted-foreground">
                            "{rating.review}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}