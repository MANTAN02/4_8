import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  Store, 
  MapPin, 
  Star, 
  Search,
  Filter,
  Coins,
  Phone,
  Navigation
} from "lucide-react";
import { CATEGORY_FILTER_OPTIONS, getCategoryLabel } from "@shared/constants";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPincode, setSelectedPincode] = useState("");

  // Build API query based on filters
  const buildQuery = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.append("category", selectedCategory);
    if (selectedPincode) params.append("pincode", selectedPincode);
    return params.toString() ? `?${params.toString()}` : "";
  };

  const { data: businesses, isLoading } = useQuery<Business[]>({
    queryKey: [`/api/businesses${buildQuery()}`],
  });

  // Filter businesses by search query
  const filteredBusinesses = businesses?.filter(business =>
    business.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    business.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    business.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "restaurant": return "🍽️";
      case "retail": return "🛍️";
      case "services": return "🔧";
      case "grocery": return "🛒";
      case "pharmacy": return "💊";
      case "electronics": return "📱";
      case "clothing": return "👕";
      default: return "🏪";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Explore Local Businesses</h1>
          <p className="text-gray-600 mt-2">Discover amazing businesses in Mumbai and earn B-Coins</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search businesses..."
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
                {CATEGORY_FILTER_OPTIONS.map(category => (
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

              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("");
                  setSelectedPincode("");
                }}
              >
                Clear Filters
              </Button>
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
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                Found {filteredBusinesses.length} businesses
                {selectedCategory && ` in ${categories.find(c => c.value === selectedCategory)?.label}`}
                {selectedPincode && ` in ${pincodes.find(p => p.value === selectedPincode)?.label}`}
              </p>
            </div>

            {/* Business Grid */}
            {filteredBusinesses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBusinesses.map((business) => (
                  <Card key={business.id} className="hover:shadow-lg transition-shadow border-2 hover:border-orange-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {getCategoryIcon(business.category)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{business.businessName}</CardTitle>
                            <CardDescription className="capitalize">
                              {business.category}
                              {business.isVerified && (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                  ✓ Verified
                                </span>
                              )}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-orange-600">{business.bCoinRate}%</div>
                          <div className="text-xs text-gray-500">B-Coin Rate</div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
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

                        {business.phone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Phone className="w-4 h-4" />
                            <span>{business.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-2 text-sm">
                          <Coins className="w-4 h-4 text-orange-500" />
                          <span className="text-orange-600 font-medium">
                            Earn {business.bCoinRate}% B-Coins on every purchase
                          </span>
                        </div>

                        <div className="flex space-x-2 pt-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              // Open Google Maps or similar
                              const encodedAddress = encodeURIComponent(business.address);
                              window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                            }}
                          >
                            <Navigation className="w-4 h-4 mr-2" />
                            Get Directions
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              if (business.phone) {
                                window.open(`tel:${business.phone}`, '_self');
                              }
                            }}
                            disabled={!business.phone}
                          >
                            <Phone className="w-4 h-4" />
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
                    Try adjusting your search criteria or check back later for new businesses.
                  </p>
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("");
                      setSelectedPincode("");
                    }}
                  >
                    Clear All Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}