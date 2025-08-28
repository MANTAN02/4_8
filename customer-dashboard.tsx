import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Coins, QrCode, MapPin, History, Star, Store, TrendingUp, Users, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { authService } from "@/lib/auth";
import { useLocation } from "wouter";
import Navigation from "@/components/navigation";
import EnhancedQRScanner from "@/components/enhanced-qr-scanner";
import EnhancedCustomerFeatures from "@/components/enhanced-customer-features";
import { BUSINESS_CATEGORIES } from "@/lib/constants";

export default function CustomerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authService.getUser();

  useEffect(() => {
    if (!user || user.userType !== 'customer') {
      setLocation("/customer-login");
      return;
    }
  }, [user, setLocation]);

  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/customers", user?.id, "profile"],
    enabled: !!user?.id,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<any[]>({
    queryKey: ["/api/bcoin-transactions/user", user?.id],
    enabled: !!user?.id,
  });

  const { data: bundles = [], isLoading: bundlesLoading } = useQuery<any[]>({
    queryKey: ["/api/bundles"],
  });

  const { data: offers = [], isLoading: offersLoading } = useQuery<any[]>({
    queryKey: ["/api/offers"],
  });

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [billAmount, setBillAmount] = useState("");
  const [requestedDiscount, setRequestedDiscount] = useState("");
  const [method, setMethod] = useState<"upi" | "card">("upi");
  const [preview, setPreview] = useState<any | null>(null);
  const [qrVerifiedBusinessId, setQrVerifiedBusinessId] = useState<string | null>(null);

  const previewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/redeem/preview", {
        customerId: user?.id,
        businessId: selectedBusiness?.id,
        billAmount,
        requestedDiscount,
        method,
      });
      return response.json();
    },
    onSuccess: (data) => setPreview(data),
  });

  const initiateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/payments/phonepe/initiate", {
        customerId: user?.id,
        businessId: selectedBusiness?.id,
        billAmount,
        discount: preview?.discount || requestedDiscount || "0",
        method,
      });
      return response.json();
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/payments/phonepe/confirm", {
        customerId: user?.id,
        businessId: selectedBusiness?.id,
        billAmount,
        discount: preview?.discount || requestedDiscount || "0",
        paymentRequestId: initiateMutation.data?.paymentRequestId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful",
        description: "Prebucks applied and payment confirmed.",
      });
      setPayDialogOpen(false);
      setPreview(null);
      setBillAmount("");
      setRequestedDiscount("");
      queryClient.invalidateQueries({ queryKey: ["/api/customers", user?.id, "profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bcoin-transactions/user", user?.id] });
    },
  });

  const ratingMutation = useMutation({
    mutationFn: async (data: { businessId: string; rating: number; comment: string }) => {
      const response = await apiRequest("POST", "/api/ratings", {
        customerId: user?.id,
        ...data
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rating Submitted!",
        description: "You've earned bonus B-Coins for your feedback!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", user?.id, "profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bcoin-transactions/user", user?.id] });
    },
  });

  const getCategoryIcon = (category: string) => {
    const cat = BUSINESS_CATEGORIES.find(c => c.value === category);
    return cat?.icon || "🏪";
  };

  if (!user) {
    return null;
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-baartal-cream">
        <Navigation />
        <div className="flex items-center justify-center pt-20">
          <div className="animate-pulse text-baartal-blue">Loading your dashboard...</div>
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
          <h1 className="text-3xl font-bold text-baartal-blue mb-2">Welcome back, {user.name}!</h1>
          <p className="text-gray-600">Your Prebucks wallet and local business network</p>
        </div>

        {/* Prebucks Balance Card */}
        <Card className="mb-8 bg-gradient-to-r from-baartal-orange to-orange-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Your Prebucks Balance</h2>
                <div className="text-4xl font-bold mb-2">₹{profile?.bCoinBalance || "0.00"}</div>
                <div className="flex items-center space-x-4 text-sm opacity-90">
                  <span>Earned: ₹{profile?.totalBCoinsEarned || "0.00"}</span>
                  <span>Spent: ₹{profile?.totalBCoinsSpent || "0.00"}</span>
                </div>
              </div>
              <div className="text-right">
                <Coins className="h-16 w-16 opacity-80 mb-4" />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                      <QrCode className="mr-2 h-4 w-4" />
                      Scan QR
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Scan & Earn Prebucks</DialogTitle>
                    </DialogHeader>
                    <EnhancedQRScanner 
                      customerId={user.id} 
                      onScanComplete={() => {
                        queryClient.invalidateQueries({ queryKey: ["/api/customers", user.id, "profile"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/bcoin-transactions/user", user.id] });
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="bundles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bundles" className="data-[state=active]:bg-baartal-orange data-[state=active]:text-white">
              <MapPin className="mr-2 h-4 w-4" />
              Explore Bundles
            </TabsTrigger>
            <TabsTrigger value="offers" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <IndianRupee className="mr-2 h-4 w-4" />
              Offers
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-baartal-blue data-[state=active]:text-white">
              <History className="mr-2 h-4 w-4" />
              Transaction History
            </TabsTrigger>
            <TabsTrigger value="rate" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Star className="mr-2 h-4 w-4" />
              Rate & Earn
            </TabsTrigger>
          </TabsList>
          <TabsContent value="offers" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offersLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-pulse text-gray-600">Loading offers...</div>
                </div>
              ) : offers.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No offers yet</h3>
                  <p className="text-gray-500">Check back soon for Prebucks partners in your area.</p>
                </div>
              ) : (
                offers.map((b: any) => (
                  <Card key={b.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg text-baartal-blue flex items-center justify-between">
                        {b.businessName}
                        <Badge className="bg-baartal-orange text-white">{b.bCoinRate}% Prebucks</Badge>
                      </CardTitle>
                      <p className="text-sm text-gray-600">{b.category} · {b.pincode}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Button
                          className="bg-baartal-blue text-white"
                          onClick={() => { setSelectedBusiness(b); setPayDialogOpen(true); setQrVerifiedBusinessId(null); setPreview(null); setBillAmount(""); setRequestedDiscount(""); }}
                        >
                          Pay with Prebucks
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Pay at {selectedBusiness?.businessName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2 font-medium">Scan shop QR to confirm location</label>
                    <EnhancedQRScanner
                      customerId={user.id}
                      onScanComplete={async (payload: any) => {
                        // Accept either qr code id or code, then fetch from backend to verify business
                        try {
                          const code = payload?.qrCode || payload?.code || payload;
                          const res = await fetch(`/api/qr-codes/${code}`);
                          if (res.ok) {
                            const data = await res.json();
                            const bizId = data?.business?.id || data?.qrCode?.businessId;
                            setQrVerifiedBusinessId(bizId || null);
                            toast({ title: "Shop verified", description: data?.business?.businessName || "QR OK" });
                          }
                        } catch {}
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Bill amount (₹)</label>
                    <Input value={billAmount} onChange={(e) => setBillAmount(e.target.value)} type="number" min="0" placeholder="e.g., 750" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Use Prebucks (₹)</label>
                    <Input value={requestedDiscount} onChange={(e) => setRequestedDiscount(e.target.value)} type="number" min="0" placeholder="e.g., 100" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Payment method</label>
                    <Select value={method} onValueChange={(v) => setMethod(v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upi">UPI (no fee)</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => previewMutation.mutate()} disabled={!billAmount || !selectedBusiness || !qrVerifiedBusinessId || (qrVerifiedBusinessId !== selectedBusiness?.id) || previewMutation.isPending}>
                      {previewMutation.isPending ? "Calculating..." : "Preview"}
                    </Button>
                    <Button onClick={() => initiateMutation.mutate()} disabled={!preview || initiateMutation.isPending}>
                      {initiateMutation.isPending ? "Initiating..." : "Initiate"}
                    </Button>
                    <Button className="bg-green-600 text-white" onClick={() => confirmMutation.mutate()} disabled={!initiateMutation.data || confirmMutation.isPending}>
                      {confirmMutation.isPending ? "Confirming..." : "Confirm & Pay"}
                    </Button>
                  </div>
                  {preview && (
                    <div className="text-sm text-gray-700 space-y-1">
                      <div>Balance: ₹{preview.balance}</div>
                      <div>Discount: ₹{preview.discount}</div>
                      <div>Fee: ₹{preview.fee}</div>
                      <div className="font-semibold">Net payable: ₹{preview.netPayable}</div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="bundles" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundlesLoading ? (
                <div className="col-span-full text-center py-8">
                  <div className="animate-pulse text-gray-600">Loading nearby bundles...</div>
                </div>
              ) : bundles.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No bundles found</h3>
                  <p className="text-gray-500">Check back soon for new business bundles in your area!</p>
                </div>
              ) : (
                bundles.map((bundle: any) => (
                  <Card key={bundle.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg text-baartal-blue flex items-center justify-between">
                        {bundle.name}
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {bundle.businesses?.length || 0}/10
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-gray-600">Pincode: {bundle.pincode}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {bundle.businesses?.slice(0, 3).map((business: any) => (
                          <div key={business.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{getCategoryIcon(business.category)}</span>
                              <span className="text-sm font-medium">{business.businessName}</span>
                            </div>
                            <Badge className="bg-baartal-orange text-white">
                              {business.bCoinPercentage}% B-Coins
                            </Badge>
                          </div>
                        ))}
                        {bundle.businesses?.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{bundle.businesses.length - 3} more businesses
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">₹{profile?.totalBCoinsEarned || "0.00"}</div>
                  <p className="text-sm text-gray-600">Total Earned</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Store className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">₹{profile?.totalBCoinsSpent || "0.00"}</div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">{transactions.length}</div>
                  <p className="text-sm text-gray-600">Transactions</p>
                </CardContent>
              </Card>
            </div>

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
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No transactions yet</h3>
                    <p className="text-gray-500">Start shopping at Baartal businesses to see your transaction history!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.slice(0, 10).map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            transaction.type === 'earned' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className={`font-semibold ${
                          transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'earned' ? '+' : '-'}₹{transaction.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rate Your Recent Visits</CardTitle>
                <p className="text-gray-600">Share your experience and earn bonus B-Coins!</p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No recent visits to rate</h3>
                  <p className="text-gray-500">Visit businesses in your bundle and you'll be able to rate them here!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
