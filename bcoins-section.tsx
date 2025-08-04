import { Button } from "@/components/ui/button";
import { Coins, RefreshCw, Infinity, Wallet } from "lucide-react";

export default function BCoinsSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-baartal-orange to-orange-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">B-Coins: Your Local Loyalty Currency</h2>
          <p className="text-xl opacity-90">Better than cashback, more valuable than points</p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <img 
              src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
              alt="Person making digital payment on mobile phone in India" 
              className="rounded-xl shadow-2xl w-full h-auto" 
            />
          </div>
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Coins className="text-2xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Earned When You Pay</h3>
                <p className="opacity-90">Get B-Coins with every purchase at Baartal businesses - typically 5-10% of your bill amount</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <RefreshCw className="text-2xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Redeemable Anywhere</h3>
                <p className="opacity-90">Use your B-Coins at any other shop in your bundle - groceries, salon, café, anywhere!</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Infinity className="text-2xl" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Never Expires</h3>
                <p className="opacity-90">Your B-Coins never expire. Save them up for bigger purchases or share with family</p>
              </div>
            </div>
            <div className="pt-4">
              <Button className="bg-white text-baartal-orange px-8 py-4 text-lg font-semibold hover:bg-gray-100">
                <Wallet className="mr-2 h-5 w-5" />
                Start Earning B-Coins
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
