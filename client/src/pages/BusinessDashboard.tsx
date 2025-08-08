import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BUSINESS_CATEGORIES } from "@shared/constants";
import { 
  Store, 
  Users, 
  TrendingUp, 
  QrCode, 
  Plus,
  Star,
  Calendar,
  DollarSign
} from "lucide-react";
import { useLocation } from "wouter";

interface Business {
  id: string;
  businessName: string;
  category: string;
  description: string;
  address: string;
  pincode: string;
  phone: string;
  bCoinRate: string;
  isVerified: boolean;
  createdAt: string;
}

interface Transaction {
  id: string;
  customerId: string;
  type: string;
  amount: string;
  bCoinsChanged: string;
  description: string;
  createdAt: string;
}

export default function BusinessDashboard() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [businessForm, setBusinessForm] = useState({
    businessName: "",
    category: "",
    description: "",
    address: "",
    pincode: "",
    phone: "",
    bCoinRate: "5.00"
  });

  const { data: businesses, isLoading: businessesLoading } = useQuery<Business[]>({
    queryKey: ["/api/businesses/my"],
    enabled: !!user && user.userType === "business",
  });

  const selectedBusiness = businesses?.[0];

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: [`/api/businesses/${selectedBusiness?.id}/bcoin-transactions`],
    enabled: !!selectedBusiness,
  });

  const createBusinessMutation = useMutation({
    mutationFn: async (data: typeof businessForm) => {
      return apiRequest("/api/businesses", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Business created successfully!",
      });
      setShowCreateForm(false);
      setBusinessForm({
        businessName: "",
        category: "",
        description: "",
        address: "",
        pincode: "",
        phone: "",
        bCoinRate: "5.00"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/businesses/my"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || user.userType !== "business") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">This dashboard is only available for businesses.</p>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const handleCreateBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessForm.businessName || !businessForm.category || !businessForm.address) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createBusinessMutation.mutate(businessForm);
  };

  const totalRevenue = transactions?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
  const totalTransactions = transactions?.length || 0;
  const totalBCoinsGiven = transactions?.reduce((sum, t) => sum + parseFloat(t.bCoinsChanged), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Business Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your business and track customer engagement</p>
        </div>

        {businessesLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : !selectedBusiness ? (
          /* Create Business Form */
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Create Your Business Profile</CardTitle>
              <CardDescription>Set up your business to start attracting customers with B-Coins</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBusiness} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={businessForm.businessName}
                      onChange={(e) => setBusinessForm({...businessForm, businessName: e.target.value})}
                      placeholder="Enter business name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={businessForm.category}
                      onChange={(e) => setBusinessForm({...businessForm, category: e.target.value})}
                      required
                    >
                      <option value="">Select category</option>
                      {BUSINESS_CATEGORIES.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    value={businessForm.description}
                    onChange={(e) => setBusinessForm({...businessForm, description: e.target.value})}
                    placeholder="Describe your business"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={businessForm.address}
                    onChange={(e) => setBusinessForm({...businessForm, address: e.target.value})}
                    placeholder="Enter complete address"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={businessForm.pincode}
                      onChange={(e) => setBusinessForm({...businessForm, pincode: e.target.value})}
                      placeholder="e.g., 400001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={businessForm.phone}
                      onChange={(e) => setBusinessForm({...businessForm, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bCoinRate">B-Coin Reward Rate (%)</Label>
                  <Input
                    id="bCoinRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={businessForm.bCoinRate}
                    onChange={(e) => setBusinessForm({...businessForm, bCoinRate: e.target.value})}
                    placeholder="5.0"
                  />
                  <p className="text-sm text-gray-500">
                    Percentage of purchase amount given as B-Coins to customers
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createBusinessMutation.isPending}
                >
                  {createBusinessMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    "Create Business Profile"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Business Dashboard */
          <>
            {/* Business Info */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Store className="w-6 h-6 text-orange-600" />
                      <span>{selectedBusiness.businessName}</span>
                    </CardTitle>
                    <CardDescription className="capitalize">
                      {selectedBusiness.category} • {selectedBusiness.address}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">{selectedBusiness.bCoinRate}%</div>
                    <div className="text-sm text-gray-500">B-Coin Rate</div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{totalRevenue.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">From B-Coin transactions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {totalTransactions}
                  </div>
                  <p className="text-xs text-muted-foreground">Total customer visits</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">B-Coins Given</CardTitle>
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {totalBCoinsGiven.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">Rewards distributed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <Star className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedBusiness.isVerified ? "Verified" : "Pending"}
                  </div>
                  <p className="text-xs text-muted-foreground">Verification status</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest customer transactions at your business</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.slice(0, 10).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 text-green-600 rounded-full">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">₹{transaction.amount}</p>
                          <p className="text-sm text-orange-600">{transaction.bCoinsChanged} B-Coins</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No transactions yet</p>
                    <p className="text-sm text-gray-400 mb-4">Start accepting B-Coin payments to see activity here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your business operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="flex items-center justify-center space-x-2 h-16"
                    onClick={() => setLocation("/qr-codes")}
                  >
                    <QrCode className="w-6 h-6" />
                    <span>Generate QR Codes</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center justify-center space-x-2 h-16"
                    onClick={() => setLocation("/business-profile")}
                  >
                    <Store className="w-6 h-6" />
                    <span>Edit Profile</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center justify-center space-x-2 h-16"
                    onClick={() => setLocation("/analytics")}
                  >
                    <TrendingUp className="w-6 h-6" />
                    <span>View Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}