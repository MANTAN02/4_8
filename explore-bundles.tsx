import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Scissors, Utensils, Shirt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Bundle {
  id: string;
  name: string;
  pincode: string;
  businesses: Array<{
    id: string;
    businessName: string;
    category: string;
    bCoinPercentage: string;
  }>;
}

export default function ExploreBundles() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: bundles = [], isLoading } = useQuery<Bundle[]>({
    queryKey: ["/api/bundles"],
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "kirana": return ShoppingCart;
      case "salon": return Scissors;
      case "food": return Utensils;
      case "clothing": return Shirt;
      default: return ShoppingCart;
    }
  };

  const filteredBundles = bundles.filter(bundle => 
    bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bundle.pincode.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">Loading bundles...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="bundles" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-baartal-blue mb-4">Explore Bundles by Region</h2>
          <p className="text-xl text-gray-600">Discover trusted local businesses near you</p>
        </div>
        
        {/* Region Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Search by area or pincode..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-full focus:border-baartal-orange text-lg h-auto"
            />
            <Button className="absolute right-2 top-2 bg-baartal-orange text-white px-6 py-2 rounded-full hover:bg-orange-600">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sample Bundles */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBundles.slice(0, 6).map((bundle) => (
            <div key={bundle.id} className="bg-gradient-to-br from-white to-baartal-cream rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-baartal-blue">{bundle.name}</h3>
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                    {bundle.businesses.length}/10 slots filled
                  </span>
                </div>
                <img 
                  src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                  alt="Bustling Mumbai street market with various vendors" 
                  className="w-full h-32 object-cover rounded-lg mb-4" 
                />
                
                <div className="space-y-3">
                  {bundle.businesses.slice(0, 3).map((business) => {
                    const Icon = getCategoryIcon(business.category);
                    return (
                      <div key={business.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className="text-baartal-orange h-4 w-4" />
                          <span className="text-baartal-blue font-medium">{business.businessName}</span>
                        </div>
                        <span className="text-baartal-orange font-bold">{business.bCoinPercentage}% B-Coins</span>
                      </div>
                    );
                  })}
                  {bundle.businesses.length < 10 && (
                    <div className="flex items-center justify-between opacity-60">
                      <div className="flex items-center space-x-3">
                        <ShoppingCart className="text-gray-400 h-4 w-4" />
                        <span className="text-gray-500">More slots available</span>
                      </div>
                      <span className="text-sm text-green-600 font-medium">Join Now</span>
                    </div>
                  )}
                </div>
                
                <Button className="w-full mt-6 bg-baartal-orange text-white py-3 font-semibold hover:bg-orange-600">
                  View Bundle Details
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button 
            variant="outline"
            className="border-2 border-baartal-orange text-baartal-orange px-8 py-3 font-semibold hover:bg-baartal-orange hover:text-white"
          >
            View All 50+ Mumbai Regions
          </Button>
        </div>
      </div>
    </section>
  );
}
