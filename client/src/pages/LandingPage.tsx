import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Coins, 
  Store, 
  Users, 
  QrCode, 
  Star, 
  MapPin, 
  ArrowRight, 
  Shield,
  Zap,
  Heart
} from "lucide-react";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: <Coins className="w-6 h-6 text-orange-600" />,
      title: "Earn B-Coins",
      description: "Shop at local businesses and earn B-Coins with every purchase. Use them for discounts and special offers."
    },
    {
      icon: <QrCode className="w-6 h-6 text-orange-600" />,
      title: "QR Code Transactions",
      description: "Simple and fast transactions using QR codes. No cash, no cards - just scan and earn."
    },
    {
      icon: <Store className="w-6 h-6 text-orange-600" />,
      title: "Local Business Network",
      description: "Discover amazing local businesses in Mumbai and support your community."
    },
    {
      icon: <Users className="w-6 h-6 text-orange-600" />,
      title: "Community Bundles",
      description: "Join local community groups and enjoy exclusive offers from bundle partners."
    },
    {
      icon: <Star className="w-6 h-6 text-orange-600" />,
      title: "Reviews & Ratings",
      description: "Rate and review businesses to help others discover the best local spots."
    },
    {
      icon: <MapPin className="w-6 h-6 text-orange-600" />,
      title: "Hyperlocal Focus",
      description: "Exclusively serving Mumbai with deep local knowledge and connections."
    }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Regular Customer",
      content: "I've earned over 500 B-Coins shopping at my favorite local stores. It's amazing how much I save!",
      rating: 5
    },
    {
      name: "Rajesh Patel",
      role: "Restaurant Owner",
      content: "Baartal brought 40% more customers to my restaurant. The QR code system is so easy to use.",
      rating: 5
    },
    {
      name: "Meera Singh",
      role: "Community Member",
      content: "Love discovering new businesses in my area through Baartal's community bundles.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="mx-auto mb-8 w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">B</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-orange-600">Baartal</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Mumbai's premier hyperlocal platform connecting customers with local businesses through B-Coin rewards and community engagement
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-orange-600 hover:bg-orange-700 text-lg px-8"
                onClick={() => setLocation("/register")}
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8"
                onClick={() => setLocation("/login")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Baartal?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of local commerce with our innovative B-Coin loyalty system
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-orange-200 transition-colors">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    {feature.icon}
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Baartal Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to start earning B-Coins and supporting local businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto mb-6 w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sign Up</h3>
              <p className="text-gray-600">
                Create your free account as a customer or business owner in just minutes
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-6 w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Shop Local</h3>
              <p className="text-gray-600">
                Visit participating businesses and scan QR codes to complete transactions
              </p>
            </div>
            
            <div className="text-center">
              <div className="mx-auto mb-6 w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Earn Rewards</h3>
              <p className="text-gray-600">
                Automatically earn B-Coins with every purchase and redeem them for discounts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What People Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied customers and business owners in Mumbai
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <CardDescription>{testimonial.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 italic">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Join the Baartal Community?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Start earning B-Coins today and discover the best local businesses in Mumbai
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8"
              onClick={() => setLocation("/register")}
            >
              Join as Customer
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 border-white text-white hover:bg-white hover:text-orange-600"
              onClick={() => setLocation("/register")}
            >
              Register Business
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">B</span>
                </div>
                <span className="text-xl font-bold">Baartal</span>
              </div>
              <p className="text-gray-400">
                Mumbai's hyperlocal platform for B-Coin rewards and community commerce.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>B-Coin Rewards</li>
                <li>QR Code Payments</li>
                <li>Local Business Discovery</li>
                <li>Community Bundles</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Business</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Customer Acquisition</li>
                <li>Loyalty Programs</li>
                <li>Analytics Dashboard</li>
                <li>Community Engagement</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Baartal. All rights reserved. Made with ❤️ in Mumbai.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}