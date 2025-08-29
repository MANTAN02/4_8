import { useState } from "react";
import { Link } from "wouter";
import { 
  UtensilsCrossed, 
  Coffee, 
  Shirt, 
  Gift, 
  Gem, 
  Scissors, 
  Cross, 
  Footprints, 
  Glasses, 
  Wrench, 
  Smartphone, 
  Package,
  Search,
  TrendingUp,
  Star,
  ArrowRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BUSINESS_CATEGORIES } from "@shared/constants";

const iconMap = {
  UtensilsCrossed,
  Coffee,
  Shirt,
  Gift,
  Gem,
  Scissors,
  Cross,
  Footprints,
  Glasses,
  Wrench,
  Smartphone,
  Package,
};

export default function ShopCategories() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = BUSINESS_CATEGORIES.filter(category =>
    category.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    return IconComponent || Package;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-pink-600 to-purple-700">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center items-center mb-6">
              <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                <TrendingUp className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Discover Local 
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent"> Shops</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Explore Mumbai's best businesses by category and earn B-Coins with every purchase
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 text-lg bg-white/10 backdrop-blur-sm border-white/30 text-white placeholder:text-white/70 focus:bg-white/20"
                data-testid="input-category-search"
              />
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-yellow-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-pink-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Category</h2>
          <p className="text-lg text-gray-600">Find exactly what you're looking for in Mumbai</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredCategories.map((category) => {
            const IconComponent = getIcon(category.icon);
            
            return (
              <Link 
                key={category.value} 
                href={`/shops?category=${category.value}`}
                data-testid={`category-${category.value}`}
              >
                <Card className="group cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white overflow-hidden">
                  <div className={`h-2 ${category.color}`}></div>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      {/* Icon with animated background */}
                      <div className="relative">
                        <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        <div className={`absolute inset-0 w-16 h-16 ${category.color} rounded-full opacity-0 group-hover:opacity-25 group-hover:scale-125 transition-all duration-500`}></div>
                      </div>
                      
                      {/* Category Info */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                          {category.label}
                        </h3>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {category.description}
                        </p>
                      </div>
                      
                      {/* Action indicator */}
                      <div className="flex items-center space-x-2 text-orange-600 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <span className="text-sm font-medium">Explore shops</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* No results message */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600">Try adjusting your search term</p>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-orange-500">1000+</div>
              <div className="text-lg text-gray-300">Partner Businesses</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-purple-400">50,000+</div>
              <div className="text-lg text-gray-300">Happy Customers</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Star className="w-8 h-8 text-yellow-400 fill-current" />
                <div className="text-4xl font-bold text-yellow-400">4.8</div>
              </div>
              <div className="text-lg text-gray-300">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-orange-600 to-purple-700 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">Start Earning B-Coins Today!</h2>
          <p className="text-xl text-white/90 mb-8">
            Shop at local businesses and earn rewards with every purchase
          </p>
          <Link href="/register">
            <button 
              className="bg-white text-orange-600 font-bold py-3 px-8 rounded-full text-lg hover:bg-gray-100 transition-colors duration-300 shadow-lg"
              data-testid="button-get-started"
            >
              Get Started Now
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}