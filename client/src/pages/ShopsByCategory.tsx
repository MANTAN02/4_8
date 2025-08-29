import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Search,
  Grid,
  List
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { BUSINESS_CATEGORIES, getCategoryLabel } from "@shared/constants";
import type { Business } from "@shared/schema";

export default function ShopsByCategory() {
  const [, setLocation] = useLocation();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const category = searchParams.get("category") || "";
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const categoryInfo = BUSINESS_CATEGORIES.find(cat => cat.value === category);

  const { data: businesses, isLoading, error } = useQuery({
    queryKey: ["/api/businesses", { category }],
    enabled: !!category,
  });

  const filteredBusinesses = Array.isArray(businesses) ? businesses.filter((business: Business) =>
    business.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.address.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No category selected</h1>
          <Button onClick={() => setLocation("/categories")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`${categoryInfo?.color || 'bg-orange-600'} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => setLocation("/categories")}
              className="text-white hover:bg-white/20"
              data-testid="button-back-categories"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Categories
            </Button>
            
            <div className="flex items-center space-x-4">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="text-white hover:bg-white/20"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="text-white hover:bg-white/20"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">{getCategoryLabel(category)}</h1>
            <p className="text-xl text-white/90 mb-6">{categoryInfo?.description}</p>
            
            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={`Search ${getCategoryLabel(category).toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/70 focus:bg-white/20"
                data-testid="input-business-search"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">Failed to load businesses</div>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-gray-600">
                {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'business' : 'businesses'} found
              </div>
            </div>

            {/* Businesses Grid/List */}
            {filteredBusinesses.length > 0 ? (
              <div className={
                viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }>
                {filteredBusinesses.map((business: Business) => (
                  <Card 
                    key={business.id} 
                    className="hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                    data-testid={`business-card-${business.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-bold text-gray-900 line-clamp-1">
                          {business.businessName}
                        </CardTitle>
                        {business.isVerified && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="line-clamp-1">{business.address}</span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {business.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {business.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium">4.5</span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>Open</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium text-orange-600">
                            {business.bCoinRate || 5}% B-Coins
                          </div>
                          <div className="text-xs text-gray-500">per purchase</div>
                        </div>
                      </div>
                      
                      {business.phone && (
                        <div className="flex items-center mt-3 pt-3 border-t">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">{business.phone}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  No businesses found {searchTerm && `for "${searchTerm}"`}
                </div>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm("")}
                  >
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}