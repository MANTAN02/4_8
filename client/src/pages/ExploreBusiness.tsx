import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Store, 
  MapPin, 
  Star, 
  Search,
  Filter,
  Coins,
  Phone,
  Navigation,
  Heart,
  Share2,
  Clock,
  Verified,
  TrendingUp,
  Users,
  Award,
  Eye
} from "lucide-react";
import { BUSINESS_CATEGORIES } from "@shared/constants";

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
  averageRating?: number;
  totalRatings?: number;
  totalTransactions?: number;
}

const pincodes = [
  { value: "", label: "All Areas" },
  { value: "400001", label: "Fort (400001)" },
  { value: "400002", label: "Kalbadevi (400002)" },
  { value: "400003", label: "Masjid (400003)" },
  { value: "400004", label: "Girgaon (400004)" },
  { value: "400005", label: "Colaba (400005)" },
  { value: "400006", label: "Malabar Hill (400006)" },
  { value: "400007", label: "Grant Road (400007)" },
  { value: "400008", label: "Mumbai Central (400008)" },
  { value: "400011", label: "Jacob Circle (400011)" },
  { value: "400012", label: "Lalbaug (400012)" },
];

export default function ExploreBusiness() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPincode, setSelectedPincode] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Build API query based on filters
  const buildQuery = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.append("category", selectedCategory);
    if (selectedPincode) params.append("pincode", selectedPincode);
    return params.toString() ? `?${params.toString()}` : "";
  };

  const { data: businesses = [], isLoading, refetch } = useQuery<Business[]>({
    queryKey: [`/api/businesses${buildQuery()}`],
  });

  // Filter and sort businesses
  const filteredBusinesses = businesses
    .filter(business =>
      business.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.address.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0);
        case "bcoins":
          return parseFloat(b.bCoinRate || "0") - parseFloat(a.bCoinRate || "0");
        case "transactions":
          return (b.totalTransactions || 0) - (a.totalTransactions || 0);
        case "name":
          return a.businessName.localeCompare(b.businessName);
        default:
          return 0;
      }
    });

  const handleFavorite = (businessId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(businessId)) {
      newFavorites.delete(businessId);
      toast({
        title: "Removed from favorites",
        description: "Business removed from your favorites",
      });
    } else {
      newFavorites.add(businessId);
      toast({
        title: "Added to favorites ❤️",
        description: "Business added to your favorites",
      });
    }
    setFavorites(newFavorites);
  };

  const handleShare = async (business: Business) => {
    try {
      await navigator.share({
        title: business.businessName,
        text: `Check out ${business.businessName} on Prebucks - Your discount currency!`,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied! 📋',
        description: 'Business link copied to clipboard',
      });
    }
  };

  const handleVisitBusiness = (business: Business) => {
    toast({
      title: `Visiting ${business.businessName}`,
      description: "Opening directions and contact info...",
    });
    
    // Open Google Maps
    const encodedAddress = encodeURIComponent(business.address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const getCategoryIcon = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      "restaurant": "🍽️",
      "cafe": "☕",
      "retail": "🛍️",
      "services": "🔧",
      "grocery": "🛒",
      "pharmacy": "💊",
      "electronics": "📱",
      "clothing": "👕",
      "salon": "💄",
      "fitness": "💪"
    };
    return categoryMap[category] || "🏪";
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Explore Local Businesses</h1>
              <p className="text-gray-600 mt-2">Discover amazing businesses in Mumbai and earn Prebucks</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                List
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-lg font-bold">{businesses.length}</div>
                  <div className="text-xs text-gray-600">Total Businesses</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Verified className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-lg font-bold">{businesses.filter(b => b.isVerified).length}</div>
                  <div className="text-xs text-gray-600">Verified</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="text-lg font-bold">4.8</div>
                  <div className="text-xs text-gray-600">Avg Rating</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-lg font-bold">8.5%</div>
                  <div className="text-xs text-gray-600">Avg Prebucks</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Search & Filter</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search businesses, categories, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {BUSINESS_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={selectedPincode}
                onChange={(e) => setSelectedPincode(e.target.value)}
              >
                {pincodes.map(pincode => (
                  <option key={pincode.value} value={pincode.value}>
                    {pincode.label}
                  </option>
                ))}
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="rating">Sort by Rating</option>
                <option value="bcoins">Sort by Prebucks %</option>
                <option value="transactions">Sort by Popularity</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                    setSelectedPincode("");
                    setSortBy("rating");
                  }}
                >
                  Clear All Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                >
                  Refresh
                </Button>
              </div>
              
              <p className="text-sm text-gray-600">
                Found {filteredBusinesses.length} businesses
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Business Grid/List */}
            {filteredBusinesses.length > 0 ? (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {filteredBusinesses.map((business) => (
                  <Card 
                    key={business.id} 
                    className="hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-200 group cursor-pointer"
                    onClick={() => handleVisitBusiness(business)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="text-2xl">
                            {getCategoryIcon(business.category)}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg group-hover:text-orange-600 transition-colors flex items-center gap-2">
                              {business.businessName}
                              {business.isVerified && (
                                <Verified className="w-4 h-4 text-green-600" />
                              )}
                            </CardTitle>
                            <CardDescription className="capitalize flex items-center gap-2">
                              {business.category}
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                {business.bCoinRate}% Prebucks
                              </Badge>
                            </CardDescription>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFavorite(business.id);
                            }}
                          >
                            <Heart className={`w-4 h-4 ${favorites.has(business.id) ? 'fill-red-500 text-red-500' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(business);
                            }}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {business.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {business.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{business.address}</span>
                        </div>

                        {/* Rating and Stats */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= (business.averageRating || 0)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="text-sm text-gray-600 ml-1">
                                ({business.totalRatings || 0})
                              </span>
                            </div>
                            
                            {business.totalTransactions && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <TrendingUp className="w-3 h-3" />
                                <span>{business.totalTransactions} visits</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {business.phone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Phone className="w-4 h-4" />
                            <span>{business.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-2 text-sm">
                          <Coins className="w-4 h-4 text-orange-500" />
                          <span className="text-orange-600 font-medium">
                            Earn {business.bCoinRate}% Prebucks on every purchase
                          </span>
                        </div>

                        {/* Business Hours */}
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span className="text-green-600 font-medium">Open Now</span>
                          <span>• Closes 9:00 PM</span>
                        </div>

                        <div className="flex space-x-2 pt-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-orange-600 hover:bg-orange-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation('/scanner');
                            }}
                          >
                            <Navigation className="w-4 h-4 mr-2" />
                            Visit & Earn
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (business.phone) {
                                window.open(`tel:${business.phone}`, '_self');
                              }
                            }}
                            disabled={!business.phone}
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast({
                                title: "Business Details",
                                description: `${business.businessName} - ${business.category} in ${business.address}`,
                              });
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || selectedCategory || selectedPincode
                      ? "Try adjusting your search criteria or check back later for new businesses."
                      : "No businesses available at the moment. Check back soon!"}
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("");
                        setSelectedPincode("");
                      }}
                    >
                      Clear All Filters
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setLocation('/business-login')}
                    >
                      Register Your Business
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          <Button
            size="lg"
            className="rounded-full shadow-lg bg-orange-600 hover:bg-orange-700"
            onClick={() => setLocation('/scanner')}
          >
            <Search className="w-5 h-5 mr-2" />
            Scan QR
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full shadow-lg bg-white"
            onClick={() => setLocation('/bundles')}
          >
            <MapPin className="w-5 h-5 mr-2" />
            View Bundles
          </Button>
        </div>
      </div>
    </div>
  );
}