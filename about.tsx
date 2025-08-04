import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, Heart, Users, Target, MapPin, Lightbulb } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center text-4xl font-bold text-baartal-orange mb-4">
            <Coins className="mr-2" />
            Baartal
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-baartal-blue mb-6">
            Connecting Mumbai's Local Businesses
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're building a hyperlocal barter and loyalty platform that helps local businesses grow together 
            while giving customers more value for their money.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold text-baartal-blue mb-4 flex items-center">
                  <Target className="mr-2" />
                  Our Mission
                </h2>
                <p className="text-gray-700 mb-4">
                  To revolutionize how local businesses in Mumbai collaborate and how customers experience 
                  their neighborhood economy. We believe that when local businesses work together, 
                  everyone wins - customers get better value, businesses grow their customer base, 
                  and communities become stronger.
                </p>
                <p className="text-gray-700">
                  Through our B-Coin loyalty system and exclusive bundle partnerships, we're creating 
                  a new model of local commerce that prioritizes community over competition.
                </p>
              </div>
              <div className="text-center">
                <img 
                  src="https://images.unsplash.com/photo-1574004907641-57850f90c1be?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300" 
                  alt="Mumbai local business community" 
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Story Section */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-baartal-blue mb-6 flex items-center">
              <Lightbulb className="mr-2" />
              Our Story
            </h2>
            <div className="space-y-6 text-gray-700">
              <p>
                Baartal was born from a simple observation: Mumbai's local businesses are incredibly 
                diverse and complementary, yet they often compete instead of collaborate. A customer 
                might visit a kirana store for groceries, then a salon for a haircut, and then a 
                café for coffee – all in the same neighborhood, but these businesses barely knew each other.
              </p>
              <p>
                We saw an opportunity to create bundles of complementary businesses that could work 
                together to provide customers with a seamless local experience. By introducing B-Coins 
                as a shared loyalty currency, we've made it possible for a customer to earn rewards 
                at one shop and spend them at another, creating a virtuous cycle of local spending.
              </p>
              <p>
                Starting with Mumbai, we're building the foundation for a new kind of local economy – 
                one where businesses thrive together and customers are rewarded for supporting their community.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Values Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Heart className="h-12 w-12 text-baartal-orange mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-baartal-blue mb-2">Community First</h3>
              <p className="text-gray-600">
                We believe in strengthening local communities by helping businesses support each other.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-baartal-orange mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-baartal-blue mb-2">Collaboration</h3>
              <p className="text-gray-600">
                Instead of competing, we help businesses collaborate to create more value for customers.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <MapPin className="h-12 w-12 text-baartal-orange mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-baartal-blue mb-2">Hyperlocal Focus</h3>
              <p className="text-gray-600">
                We're deeply committed to understanding and serving each neighborhood's unique needs.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Mumbai Focus Section */}
        <Card className="mb-12 bg-gradient-to-r from-baartal-blue to-blue-900 text-white">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">Why Mumbai?</h2>
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <p className="opacity-90">
                  Mumbai is India's commercial capital and a city of neighborhoods. Each area has its 
                  own character, its own businesses, and its own community. From the bustling markets 
                  of Andheri to the coastal charm of Bandra, every locality has something unique to offer.
                </p>
                <p className="opacity-90">
                  We chose to start in Mumbai because of its incredible diversity of local businesses, 
                  the strong neighborhood identities, and the entrepreneurial spirit that drives the city. 
                  Mumbai's local economy is the perfect place to test and refine our bundle model.
                </p>
                <p className="opacity-90">
                  As we grow, we'll carry the lessons learned in Mumbai to other cities across India, 
                  but we'll always remember where we started – in the heart of India's most dynamic city.
                </p>
              </div>
              <div className="text-center">
                <img 
                  src="https://images.unsplash.com/photo-1567157577867-05ccb1388e66?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300" 
                  alt="Mumbai skyline and local markets" 
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="text-center">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-baartal-blue mb-4">Join Our Journey</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Whether you're a business owner looking to grow your customer base or a customer 
              who wants to get more value from local shopping, we'd love to have you as part of the Baartal community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/business-login" 
                className="bg-baartal-orange text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors inline-block"
              >
                Join as Business
              </a>
              <a 
                href="/customer-login" 
                className="bg-baartal-blue text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-800 transition-colors inline-block"
              >
                Join as Customer
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
