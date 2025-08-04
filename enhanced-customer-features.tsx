import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { QrCode, Star, MapPin, Coins, Eye, ShoppingBag, TrendingUp } from "lucide-react";
import EnhancedQRScanner from "@/components/enhanced-qr-scanner";

interface CustomerFeaturesProps {
  user: any;
  bCoinsBalance: number;
  transactions: any[];
  bundles: any[];
}

export default function EnhancedCustomerFeatures({ 
  user, 
  bCoinsBalance, 
  transactions,
  bundles 
}: CustomerFeaturesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);

  const redeemBCoinsMutation = useMutation({
    mutationFn: async (data: { businessId: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/bcoin-transactions", {
        customerId: user.id,
        businessId: data.businessId,
        amount: -data.amount,
        type: "redemption"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "B-Coins Redeemed!",
        description: "Your B-Coins have been successfully redeemed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bcoin-transactions/customer", user.id] });
    },
    onError: () => {
      toast({
        title: "Redemption Failed",
        description: "Unable to redeem B-Coins. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addRatingMutation = useMutation({
    mutationFn: async (data: { businessId: string; rating: number; comment?: string }) => {
      const response = await apiRequest("POST", "/api/ratings", {
        customerId: user.id,
        businessId: data.businessId,
        rating: data.rating,
        comment: data.comment
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Added!",
        description: "Thank you for your feedback!",
      });
    },
  });



  const recentTransactions = transactions.slice(0, 5);
  const topBundles = bundles.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* B-Coins Balance Card */}
      <Card className="bg-gradient-to-r from-baartal-orange to-orange-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Coins className="h-6 w-6 mr-2" />
                <h3 className="text-lg font-semibold">Your B-Coins Balance</h3>
              </div>
              <div className="text-3xl font-bold">₹{bCoinsBalance.toFixed(2)}</div>
              <p className="text-orange-100 text-sm">Available for spending</p>
            </div>
            <div className="text-right">
              <Button 
                variant="outline" 
                className="bg-white text-baartal-orange hover:bg-gray-100 mb-2"
                onClick={() => setShowQRScanner(true)}
              >
                <QrCode className="mr-2 h-4 w-4" />
                Scan QR
              </Button>
              <div className="text-sm text-orange-100">
                Earned this month: ₹{transactions
                  .filter(t => t.amount > 0 && new Date(t.createdAt).getMonth() === new Date().getMonth())
                  .reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowQRScanner(true)}>
          <CardContent className="p-6 text-center">
            <QrCode className="h-10 w-10 text-baartal-orange mx-auto mb-3" />
            <h4 className="font-semibold text-baartal-blue mb-2">Earn B-Coins</h4>
            <p className="text-sm text-gray-600">Scan QR codes to earn rewards</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <ShoppingBag className="h-10 w-10 text-baartal-blue mx-auto mb-3" />
            <h4 className="font-semibold text-baartal-blue mb-2">Find Businesses</h4>
            <p className="text-sm text-gray-600">Discover local partner shops</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-10 w-10 text-green-600 mx-auto mb-3" />
            <h4 className="font-semibold text-baartal-blue mb-2">View Stats</h4>
            <p className="text-sm text-gray-600">Track your savings & rewards</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-baartal-blue">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No transactions yet</h3>
              <p className="text-gray-500 mb-4">Start earning B-Coins by visiting participating businesses!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${transaction.amount > 0 ? 'bg-green-100' : 'bg-orange-100'}`}>
                      {transaction.amount > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <ShoppingBag className="h-4 w-4 text-baartal-orange" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{transaction.businessName || 'Business Transaction'}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-baartal-orange'}`}>
                    {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Bundles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-baartal-blue">Popular Bundles Near You</CardTitle>
        </CardHeader>
        <CardContent>
          {topBundles.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No bundles found</h3>
              <p className="text-gray-500">We're working on bringing Baartal to your area!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topBundles.map((bundle) => (
                <Card key={bundle.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-baartal-blue">{bundle.name}</h4>
                      <Badge className="bg-baartal-orange text-white">
                        {bundle.businesses?.length || 0} shops
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      {bundle.area}, {bundle.pincode}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-baartal-orange text-baartal-orange hover:bg-baartal-orange hover:text-white"
                      onClick={() => setSelectedBundle(bundle)}
                    >
                      <Eye className="mr-2 h-3 w-3" />
                      Explore Bundle
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-baartal-blue">Scan QR Code</h3>
              <Button variant="outline" onClick={() => setShowQRScanner(false)}>
                Close
              </Button>
            </div>
            <EnhancedQRScanner customerId={user.id} />
          </div>
        </div>
      )}

      {/* Bundle Details Modal */}
      {selectedBundle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-baartal-blue">{selectedBundle.name}</h3>
                <p className="text-gray-600">{selectedBundle.area}, {selectedBundle.pincode}</p>
              </div>
              <Button variant="outline" onClick={() => setSelectedBundle(null)}>
                Close
              </Button>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-baartal-blue">Participating Businesses</h4>
              {selectedBundle.businesses?.map((business: any) => (
                <Card key={business.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{business.categoryIcon || "🏪"}</span>
                        <div>
                          <h5 className="font-semibold text-baartal-blue">{business.businessName}</h5>
                          <p className="text-sm text-gray-600">{business.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-baartal-orange text-white">
                          {business.bCoinPercentage}% B-Coins
                        </Badge>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm">4.5</span>
                        </div>
                      </div>
                    </div>
                    {business.description && (
                      <p className="text-sm text-gray-700 mb-3">{business.description}</p>
                    )}
                    <div className="flex space-x-2">
                      <Button size="sm" className="bg-baartal-orange hover:bg-orange-600">
                        Visit Store
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          // Rate business functionality
                          const rating = window.prompt("Rate this business (1-5 stars):");
                          if (rating && !isNaN(Number(rating)) && Number(rating) >= 1 && Number(rating) <= 5) {
                            addRatingMutation.mutate({
                              businessId: business.id,
                              rating: Number(rating)
                            });
                          }
                        }}
                      >
                        <Star className="mr-1 h-3 w-3" />
                        Rate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <p className="text-gray-500 text-center py-4">No businesses in this bundle yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}