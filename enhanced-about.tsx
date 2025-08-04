import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Users, Store, MapPin, Target, Heart, Shield, Zap } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Coins className="h-16 w-16 text-baartal-orange mr-4" />
              <h1 className="text-5xl font-bold text-baartal-blue">About Baartal</h1>
            </div>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Baartal is Mumbai's first hyperlocal barter and loyalty platform that connects 
              local businesses through curated "barter bundles" and empowers customers with 
              B-Coins - a digital loyalty currency that works across participating shops.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <Card className="border-baartal-orange border-2">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <Target className="h-8 w-8 text-baartal-orange mr-3" />
                  <h2 className="text-3xl font-bold text-baartal-blue">Our Mission</h2>
                </div>
                <p className="text-gray-700 text-lg leading-relaxed">
                  To strengthen Mumbai's local economy by creating exclusive territory partnerships 
                  where businesses collaborate instead of compete. We believe in fostering community 
                  commerce that benefits both businesses and customers through innovative loyalty rewards.
                </p>
              </CardContent>
            </Card>

            <Card className="border-baartal-blue border-2">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <Heart className="h-8 w-8 text-baartal-blue mr-3" />
                  <h2 className="text-3xl font-bold text-baartal-blue">Our Vision</h2>
                </div>
                <p className="text-gray-700 text-lg leading-relaxed">
                  To become Mumbai's most trusted hyperlocal platform that transforms how people 
                  discover, engage with, and support local businesses. We envision a city where 
                  every neighborhood thrives through connected commerce and community loyalty.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How Baartal Works */}
      <section className="py-16 bg-baartal-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-baartal-blue mb-4">How Baartal Works</h2>
            <p className="text-xl text-gray-700">A unique approach to local business networking</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="bg-baartal-orange rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-baartal-blue mb-4">Curated Bundles</h3>
                <p className="text-gray-700">
                  We create exclusive territory bundles with only one business per category per pincode, 
                  ensuring no direct competition and maximum collaboration.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="bg-baartal-blue rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Coins className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-baartal-blue mb-4">B-Coins System</h3>
                <p className="text-gray-700">
                  Customers earn B-Coins (typically 3-8% of purchase) at any participating business 
                  and can spend them across all bundle partners.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="bg-green-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-baartal-blue mb-4">Community Growth</h3>
                <p className="text-gray-700">
                  Businesses share customers and grow together while customers enjoy enhanced 
                  loyalty rewards across multiple local shops.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-baartal-blue mb-4">Platform Features</h2>
            <p className="text-xl text-gray-700">Built for Mumbai's unique business ecosystem</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-baartal-cream p-6 rounded-lg text-center">
              <Zap className="h-10 w-10 text-baartal-orange mx-auto mb-4" />
              <h4 className="font-bold text-baartal-blue mb-2">QR Code Scanning</h4>
              <p className="text-sm text-gray-600">Instant B-Coin earning through mobile QR scanning</p>
            </div>

            <div className="bg-baartal-cream p-6 rounded-lg text-center">
              <Shield className="h-10 w-10 text-baartal-orange mx-auto mb-4" />
              <h4 className="font-bold text-baartal-blue mb-2">Secure Transactions</h4>
              <p className="text-sm text-gray-600">Bank-level security for all B-Coin transactions</p>
            </div>

            <div className="bg-baartal-cream p-6 rounded-lg text-center">
              <Store className="h-10 w-10 text-baartal-orange mx-auto mb-4" />
              <h4 className="font-bold text-baartal-blue mb-2">Business Analytics</h4>
              <p className="text-sm text-gray-600">Comprehensive dashboards for business insights</p>
            </div>

            <div className="bg-baartal-cream p-6 rounded-lg text-center">
              <Users className="h-10 w-10 text-baartal-orange mx-auto mb-4" />
              <h4 className="font-bold text-baartal-blue mb-2">Customer Rewards</h4>
              <p className="text-sm text-gray-600">Cross-business loyalty program with real value</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-baartal-orange to-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-12">Baartal by Numbers</h2>
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">50+</div>
                <div className="text-orange-100">Partner Businesses</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">2,000+</div>
                <div className="text-orange-100">Active Customers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">₹5L+</div>
                <div className="text-orange-100">B-Coins Circulated</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">25+</div>
                <div className="text-orange-100">Mumbai Areas</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Baartal */}
      <section className="py-16 bg-baartal-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-baartal-blue mb-4">Why Choose Baartal?</h2>
            <p className="text-xl text-gray-700">Mumbai-first, community-focused, innovation-driven</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <Badge className="bg-baartal-orange text-white mb-4">For Customers</Badge>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-baartal-orange mr-2">•</span>
                    Earn B-Coins at every participating business
                  </li>
                  <li className="flex items-start">
                    <span className="text-baartal-orange mr-2">•</span>
                    Spend B-Coins across multiple local shops
                  </li>
                  <li className="flex items-start">
                    <span className="text-baartal-orange mr-2">•</span>
                    Discover quality local businesses in your area
                  </li>
                  <li className="flex items-start">
                    <span className="text-baartal-orange mr-2">•</span>
                    Support your local community economy
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Badge className="bg-baartal-blue text-white mb-4">For Businesses</Badge>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-baartal-blue mr-2">•</span>
                    Exclusive territory protection from direct competition
                  </li>
                  <li className="flex items-start">
                    <span className="text-baartal-blue mr-2">•</span>
                    Access to customers from partner businesses
                  </li>
                  <li className="flex items-start">
                    <span className="text-baartal-blue mr-2">•</span>
                    Enhanced customer loyalty through B-Coins
                  </li>
                  <li className="flex items-start">
                    <span className="text-baartal-blue mr-2">•</span>
                    Comprehensive analytics and insights
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Badge className="bg-green-600 text-white mb-4">For Mumbai</Badge>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Strengthens local economy and job creation
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Reduces dependency on large chain stores
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Builds stronger neighborhood communities
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Promotes sustainable local commerce
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}