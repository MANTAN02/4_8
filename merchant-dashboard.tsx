import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Store, Users, TrendingUp, Coins, QrCode, Star, 
  BarChart3, Bell, Settings, Upload, Eye, Download 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { authService } from "@/lib/auth";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import QRCodeGenerator from "@/components/qr-code-generator";
import EnhancedBusinessSettings from "@/components/enhanced-business-settings";
import { BUSINESS_CATEGORIES } from "@/lib/constants";

export default function MerchantDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authService.getUser();

  const [businessForm, setBusinessForm] = useState({
    businessName: "",
    description: "",
    bCoinPercentage: "5.00",
    isFeatured: false
  });

  useEffect(() => {
    if (!user || user.userType !== 'business') {
      setLocation("/business-login");
      return;
    }
  }, [user, setLocation]);

  const { data: business, isLoading: businessLoading } = useQuery<any>({
    queryKey: ["/api/businesses/user", user?.id],
    enabled: !!user?.id,
  });

  // Update form when business data loads
  useEffect(() => {
    if (business) {
      setBusinessForm({
        businessName: business.businessName || "",
        description: business.description || "",
        bCoinPercentage: business.bCoinPercentage || "5.00",
        isFeatured: business.isFeatured || false
      });
    }
  }, [business]);

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<any[]>({
    queryKey: ["/api/bcoin-transactions/business", business?.id],
    enabled: !!business?.id,
  });

  const { data: ratings = [], isLoading: ratingsLoading } = useQuery<any[]>({
    queryKey: ["/api/ratings/business", business?.id],
    enabled: !!business?.id,
  });

  const { data: bundlePartners = [], isLoading: partnersLoading } = useQuery<any[]>({
    queryKey: ["/api/businesses", "bundle", business?.bundleId],
    queryFn: async () => {
      if (!business?.bundleId) return [];
      const response = await fetch(`/api/bundles/${business.bundleId}`);
      if (!response.ok) return [];
      const bundle = await response.json();
      return bundle.businesses?.filter((b: any) => b.id !== business.id) || [];
    },
    enabled: !!business?.bundleId,
  });

  const updateBusinessMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/businesses/${business?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Business Updated!",
        description: "Your business information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/businesses/user", user?.id] });
    },
  });

  const createQRCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/qr-codes", {
        businessId: business?.id
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "QR Code Generated!",
        description: "Your new QR code is ready for customers to scan.",
      });
    },
  });

  const handleBusinessUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessMutation.mutate(businessForm);
  };

  const getCategoryIcon = (category: string) => {
    const cat = BUSINESS_CATEGORIES.find(c => c.value === category);
    return cat?.icon || "🏪";
  };

  const averageRating = ratings.length > 0 
    ? (ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : "0.0";

  if (!user) {
    return null;
  }

  if (businessLoading) {
    return (
      <div className="min-h-screen bg-baartal-cream">
        <Navigation />
        <div className="flex items-center justify-center pt-20">
          <div className="animate-pulse text-baartal-blue">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-baartal-cream">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">Business Not Found</h2>
              <p className="text-gray-500 mb-4">It looks like your business profile hasn't been set up yet.</p>
              <Button onClick={() => setLocation("/business-login")} className="bg-baartal-orange hover:bg-orange-600">
                Complete Registration
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-baartal-blue mb-2">
            {getCategoryIcon(business.category)} {business.businessName}
          </h1>
          <p className="text-gray-600">Merchant Dashboard - Manage your B-Coin business</p>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">B-Coins Issued</p>
                  <p className="text-2xl font-bold">₹{business.totalBCoinsIssued || "0.00"}</p>
                </div>
                <Coins className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">B-Coins Redeemed</p>
                  <p className="text-2xl font-bold">₹{business.totalBCoinsRedeemed || "0.00"}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Total Customers</p>
                  <p className="text-2xl font-bold">{business.totalCustomers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100">Average Rating</p>
                  <p className="text-2xl font-bold">{averageRating} ⭐</p>
                </div>
                <Star className="h-8 w-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="qr-codes">QR Codes</TabsTrigger>
            <TabsTrigger value="partners">Bundle Partners</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-pulse text-gray-600">Loading transactions...</div>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No transactions yet</h3>
                      <p className="text-gray-500">Transactions will appear here when customers use B-Coins at your store.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((transaction: any) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className={`font-semibold ${
                            transaction.type === 'earned' ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            ₹{transaction.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  {ratingsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-pulse text-gray-600">Loading reviews...</div>
                    </div>
                  ) : ratings.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No reviews yet</h3>
                      <p className="text-gray-500">Customer reviews will appear here to help improve your service.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ratings.slice(0, 3).map((rating: any) => (
                        <div key={rating.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {"⭐".repeat(rating.rating)}
                            </div>
                            <span className="text-sm text-gray-600">
                              {new Date(rating.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {rating.comment && <p className="text-sm text-gray-700">{rating.comment}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="qr-codes" className="space-y-6">
            <QRCodeGenerator businessId={business?.id} />
          </TabsContent>

          <TabsContent value="partners" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bundle Partners</CardTitle>
                <p className="text-gray-600">Other businesses in your local bundle</p>
              </CardHeader>
              <CardContent>
                {partnersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse text-gray-600">Loading bundle partners...</div>
                  </div>
                ) : bundlePartners.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No partners yet</h3>
                    <p className="text-gray-500">More businesses will join your bundle soon!</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bundlePartners.map((partner: any) => (
                      <Card key={partner.id} className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-2xl">{getCategoryIcon(partner.category)}</span>
                          <div>
                            <h4 className="font-semibold">{partner.businessName}</h4>
                            <p className="text-sm text-gray-600">{partner.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-baartal-orange text-white">
                            {partner.bCoinPercentage}% B-Coins
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-3 w-3" />
                            View
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">Analytics Coming Soon</h3>
                    <p className="text-gray-500">Detailed analytics and insights will be available here.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Peak Hours</span>
                      <Badge variant="outline">6PM - 8PM</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Top Day</span>
                      <Badge variant="outline">Saturday</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Avg Transaction</span>
                      <Badge variant="outline">₹{transactions.length > 0 ? 
                        (transactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0) / transactions.length).toFixed(0)
                        : "0"}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <EnhancedBusinessSettings business={business} userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
