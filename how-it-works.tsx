import { Button } from "@/components/ui/button";
import { ShoppingBag, Coins, RefreshCw, Crown, Handshake, Users, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function HowItWorks() {
  const [, setLocation] = useLocation();

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-baartal-blue mb-4">How Baartal Works</h2>
          <p className="text-xl text-gray-600">Simple steps to save more and support local</p>
        </div>

        {/* Customer Flow */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-baartal-blue mb-8 text-center">For Customers</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-baartal-orange rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="text-white text-2xl" />
              </div>
              <h4 className="text-xl font-semibold text-baartal-blue mb-4">1. Shop at Baartal Business</h4>
              <p className="text-gray-600">Visit any Baartal-listed business in your neighborhood bundle</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-baartal-orange rounded-full flex items-center justify-center mx-auto mb-6">
                <Coins className="text-white text-2xl" />
              </div>
              <h4 className="text-xl font-semibold text-baartal-blue mb-4">2. Earn B-Coins</h4>
              <p className="text-gray-600">Get B-Coins with every purchase - like cashback but better!</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-baartal-orange rounded-full flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="text-white text-2xl" />
              </div>
              <h4 className="text-xl font-semibold text-baartal-blue mb-4">3. Spend Anywhere</h4>
              <p className="text-gray-600">Use B-Coins at any other shop in your bundle - endless possibilities!</p>
            </div>
          </div>
          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-6 bg-baartal-cream px-8 py-4 rounded-full">
              <span className="text-baartal-blue font-semibold">✅ Save more</span>
              <span className="text-baartal-blue font-semibold">✅ Discover more</span>
              <span className="text-baartal-blue font-semibold">✅ Support local</span>
            </div>
          </div>
        </div>

        {/* Business Flow */}
        <div className="bg-gradient-to-r from-baartal-blue to-blue-900 rounded-2xl p-12 text-white">
          <h3 className="text-2xl font-bold mb-8 text-center">For Businesses</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <Crown className="text-baartal-orange text-2xl mb-4" />
              <h4 className="font-semibold mb-2">Exclusive Bundles</h4>
              <p className="text-sm opacity-90">Only 1 shop per category in each region - no direct competition</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <Handshake className="text-baartal-orange text-2xl mb-4" />
              <h4 className="font-semibold mb-2">B2B Barter</h4>
              <p className="text-sm opacity-90">Exchange services with bundle partners - salon ads for photographer services</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <Users className="text-baartal-orange text-2xl mb-4" />
              <h4 className="font-semibold mb-2">Loyal Customers</h4>
              <p className="text-sm opacity-90">B-Coins bring customers back and attract new ones from partners</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <TrendingUp className="text-baartal-orange text-2xl mb-4" />
              <h4 className="font-semibold mb-2">Pay Only When Used</h4>
              <p className="text-sm opacity-90">₹0 upfront cost. More generous you are, less you pay</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Button 
              onClick={() => setLocation("/business-login")}
              className="bg-baartal-orange text-white px-8 py-3 font-semibold hover:bg-orange-600"
            >
              Apply to Join Your Area's Bundle
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
