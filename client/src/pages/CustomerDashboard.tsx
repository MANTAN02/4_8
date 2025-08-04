import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { 
  Coins, 
  Store, 
  QrCode, 
  Star, 
  TrendingUp, 
  MapPin,
  Calendar,
  Award
} from "lucide-react";
import { useLocation } from "wouter";

interface BCoinTransaction {
  id: string;
  type: "earned" | "redeemed";
  amount: string;
  bCoinsChanged: string;
  description: string;
  createdAt: string;
}

interface Business {
  id: string;
  businessName: string;
  category: string;
  address: string;
  pincode: string;
  bCoinRate: string;
}

export default function CustomerDashboard() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useAuth();

  const { data: balance, isLoading: balanceLoading } = useQuery<{ balance: number }>({
    queryKey: ["/api/bcoin-balance/my"],
    enabled: !!user,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<BCoinTransaction[]>({
    queryKey: ["/api/bcoin-transactions/my"],
    enabled: !!user,
  });

  const { data: businesses, isLoading: businessesLoading } = useQuery<Business[]>({
    queryKey: ["/api/businesses?pincode=400001"],
    enabled: !!user,
  });

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || user.userType !== "customer") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">This dashboard is only available for customers.</p>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const recentTransactions = transactions?.slice(0, 5) || [];
  const nearbyBusinesses = businesses?.slice(0, 6) || [];
  const totalEarned = transactions?.reduce((sum, t) => sum + (t.type === "earned" ? parseFloat(t.bCoinsChanged) : 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
          <p className="text-gray-600 mt-2">Manage your B-Coins and discover local businesses</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">B-Coin Balance</CardTitle>
              <Coins className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {balanceLoading ? <LoadingSpinner size="sm" /> : `${balance?.balance || 0}`}
              </div>
              <p className="text-xs text-muted-foreground">Available to redeem</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {transactionsLoading ? <LoadingSpinner size="sm" /> : totalEarned.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">Lifetime B-Coins earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {transactionsLoading ? <LoadingSpinner size="sm" /> : transactions?.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Member Since</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <p className="text-xs text-muted-foreground">Baartal member</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Recent Transactions</span>
              </CardTitle>
              <CardDescription>Your latest B-Coin activity</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === "earned" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}>
                          {transaction.type === "earned" ? <TrendingUp className="w-4 h-4" /> : <Coins className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold ${
                        transaction.type === "earned" ? "text-green-600" : "text-red-600"
                      }`}>
                        {transaction.type === "earned" ? "+" : "-"}{transaction.bCoinsChanged}
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setLocation("/transactions")}
                  >
                    View All Transactions
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions yet</p>
                  <p className="text-sm text-gray-400 mb-4">Start shopping to earn your first B-Coins!</p>
                  <Button onClick={() => setLocation("/explore")}>
                    Explore Businesses
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nearby Businesses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Nearby Businesses</span>
              </CardTitle>
              <CardDescription>Discover local businesses in your area</CardDescription>
            </CardHeader>
            <CardContent>
              {businessesLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : nearbyBusinesses.length > 0 ? (
                <div className="space-y-4">
                  {nearbyBusinesses.map((business) => (
                    <div key={business.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-full">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{business.businessName}</p>
                          <p className="text-xs text-gray-500 capitalize">{business.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-600">{business.bCoinRate}%</p>
                        <p className="text-xs text-gray-500">B-Coin rate</p>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setLocation("/explore")}
                  >
                    Explore All Businesses
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No businesses found nearby</p>
                  <p className="text-sm text-gray-400">Check back soon for new additions!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>What would you like to do today?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                className="flex items-center justify-center space-x-2 h-16"
                onClick={() => setLocation("/scanner")}
              >
                <QrCode className="w-6 h-6" />
                <span>Scan QR Code</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center space-x-2 h-16"
                onClick={() => setLocation("/explore")}
              >
                <Store className="w-6 h-6" />
                <span>Find Businesses</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center space-x-2 h-16"
                onClick={() => setLocation("/bundles")}
              >
                <Star className="w-6 h-6" />
                <span>Join Bundles</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}