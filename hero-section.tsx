import { Button } from "@/components/ui/button";
import { Store, MapPin, Coins } from "lucide-react";
import { useLocation } from "wouter";

export default function HeroSection() {
  const [, setLocation] = useLocation();

  return (
    <section className="bg-gradient-to-br from-baartal-cream to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold text-baartal-blue mb-6">
              Barter Smarter. <span className="text-baartal-orange">Earn & Spend B-Coins</span> Across Mumbai.
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Join a bundle of trusted neighborhood businesses and grow together through barter and loyalty.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => setLocation("/business-login")}
                className="bg-baartal-orange text-white px-8 py-4 text-lg font-semibold hover:bg-orange-600 h-auto"
              >
                <Store className="mr-2 h-5 w-5" />
                Join as Business
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation("/customer-login")}
                className="border-2 border-baartal-blue text-baartal-blue px-8 py-4 text-lg font-semibold hover:bg-baartal-blue hover:text-white h-auto"
              >
                <MapPin className="mr-2 h-5 w-5" />
                Explore Baartal Bundles
              </Button>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Mumbai local market with vendors and customers" 
              className="rounded-xl shadow-2xl w-full h-auto" 
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-baartal-orange rounded-full flex items-center justify-center">
                  <Coins className="text-white text-xl" />
                </div>
                <div>
                  <div className="font-semibold text-baartal-blue">B-Coins Earned</div>
                  <div className="text-baartal-orange font-bold">₹250</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
