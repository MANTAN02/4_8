import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to <span className="text-orange-600">Baartal</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Mumbai's hyperlocal barter and loyalty platform. Earn B-Coins at local businesses 
            and spend them across our partner network.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/customer-login">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                Customer Login
              </Button>
            </Link>
            <Link href="/business-login">
              <Button size="lg" variant="outline">
                Business Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🏪</span>
              </div>
              <CardTitle>Local Businesses</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Discover and support local businesses in your neighborhood across Mumbai.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <CardTitle>B-Coins Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Earn B-Coins with every purchase and spend them at any partner business.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <CardTitle>Barter Bundles</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Join curated business bundles in your area for enhanced customer benefits.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold mb-2">Shop Local</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Visit participating businesses in your area
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold mb-2">Scan QR</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Scan the business QR code after your purchase
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold mb-2">Earn B-Coins</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Get B-Coins as a percentage of your purchase
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold mb-2">Spend Anywhere</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Use B-Coins at any partner business in the network
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}