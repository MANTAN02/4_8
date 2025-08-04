import { useState } from 'react';
import { QrCode, MapPin, Star, TrendingUp, Gift, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BCoinBalance } from '@/components/BCoinBalance';
import { BusinessCard } from '@/components/BusinessCard';
import { QRCodeScanner } from '@/components/QRCodeScanner';
import { NotificationCenter } from '@/components/NotificationCenter';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQuery } from '@tanstack/react-query';
import type { Business, Bundle } from '@shared/schema';

export default function EnhancedCustomerDashboard() {
  const [showScanner, setShowScanner] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: user } = useAuth();
  const { isConnected } = useWebSocket();

  const { data: nearbyBusinesses = [], isLoading: businessesLoading } = useQuery<Business[]>({
    queryKey: ['/api/businesses/nearby'],
  });

  const { data: recommendedBundles = [], isLoading: bundlesLoading } = useQuery<Bundle[]>({
    queryKey: ['/api/bundles/recommended'],
  });

  const { data: favoriteBusinesses = [] } = useQuery<Business[]>({
    queryKey: ['/api/customer/favorites'],
  });

  const filteredBusinesses = nearbyBusinesses.filter(business =>
    business.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    business.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleScanSuccess = (data: any) => {
    console.log('Scan successful:', data);
    // Handle successful scan - update balance, show confirmation, etc.
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user.name}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Discover local businesses and earn B-Coins
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

            {/* Notifications */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotifications(true)}
              data-testid="button-notifications"
            >
              <Bell className="w-4 h-4" />
            </Button>

            {/* QR Scanner */}
            <Button
              onClick={() => setShowScanner(true)}
              className="bg-orange-600 hover:bg-orange-700"
              data-testid="button-scan-qr"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Balance & Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* B-Coin Balance */}
            <BCoinBalance customerId={user.id} />

            {/* Quick Stats */}
            <Card data-testid="card-quick-stats">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm">This Month</span>
                  </div>
                  <span className="font-medium">₹245</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">Rewards Earned</span>
                  </div>
                  <span className="font-medium">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm">Favorites</span>
                  </div>
                  <span className="font-medium">{favoriteBusinesses.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Bundles */}
            <Card data-testid="card-recommended-bundles">
              <CardHeader>
                <CardTitle className="text-lg">Recommended Bundles</CardTitle>
                <CardDescription>
                  Curated business groups in your area
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bundlesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : recommendedBundles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No bundles available in your area yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recommendedBundles.slice(0, 3).map((bundle) => (
                      <div
                        key={bundle.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        data-testid={`bundle-${bundle.id}`}
                      >
                        <h4 className="font-medium text-sm">{bundle.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {bundle.description}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{bundle.pincode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search businesses, categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                      data-testid="input-search-businesses"
                    />
                  </div>
                  <Button variant="outline" data-testid="button-search">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Favorite Businesses */}
            {favoriteBusinesses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    Your Favorites
                  </CardTitle>
                  <CardDescription>
                    Quick access to your favorite local businesses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {favoriteBusinesses.slice(0, 4).map((business) => (
                      <BusinessCard
                        key={business.id}
                        business={business}
                        showActions={true}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nearby Businesses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Businesses Near You
                </CardTitle>
                <CardDescription>
                  Discover local businesses where you can earn B-Coins
                </CardDescription>
              </CardHeader>
              <CardContent>
                {businessesLoading ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredBusinesses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No businesses found matching your search' : 'No businesses found in your area'}
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBusinesses.map((business) => (
                      <BusinessCard
                        key={business.id}
                        business={business}
                        showActions={true}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRCodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Notifications */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}