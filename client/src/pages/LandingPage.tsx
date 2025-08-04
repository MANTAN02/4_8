import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Coins, QrCode, Star, TrendingUp, Users, Shield, Zap, Globe, Award, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: <Coins className="w-6 h-6" />,
      title: "B-Coin Rewards",
      description: "Earn loyalty coins with every purchase. Convert to real savings.",
      color: "from-yellow-500 to-amber-600"
    },
    {
      icon: <QrCode className="w-6 h-6" />,
      title: "Instant QR Scanning",
      description: "Quick, secure transactions with mobile camera scanning.",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Local Community",
      description: "Connect with verified Mumbai businesses in your area.",
      color: "from-purple-500 to-indigo-600"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Business Growth",
      description: "Advanced analytics and customer insights for businesses.",
      color: "from-green-500 to-emerald-600"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Active Users", icon: <Users className="w-5 h-5" /> },
    { number: "500+", label: "Partner Businesses", icon: <Globe className="w-5 h-5" /> },
    { number: "₹50L+", label: "Transactions", icon: <TrendingUp className="w-5 h-5" /> },
    { number: "4.9★", label: "User Rating", icon: <Star className="w-5 h-5" /> }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Small Business Owner",
      content: "Baartal increased my customer retention by 300%. The B-Coin system is revolutionary!",
      rating: 5,
      location: "Andheri, Mumbai"
    },
    {
      name: "Rajesh Kumar",
      role: "Regular Customer",
      content: "I've saved over ₹15,000 using B-Coins. Best loyalty platform in Mumbai!",
      rating: 5,
      location: "Bandra, Mumbai"
    },
    {
      name: "Meera Patel",
      role: "Restaurant Owner",
      content: "Real-time analytics help me understand my customers better. Revenue up 40%!",
      rating: 5,
      location: "Juhu, Mumbai"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-amber-600/10 dark:from-orange-400/5 dark:to-amber-400/5"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-orange-100 text-orange-800 hover:bg-orange-200" data-testid="badge-beta">
              🚀 Now Live in Mumbai
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Mumbai's #1 Loyalty Platform
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Earn B-Coins at local businesses, get real rewards, and support your community. 
              <span className="font-semibold text-orange-600"> Join 10,000+ Mumbai residents!</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-get-started">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button size="lg" variant="outline" className="border-2 border-orange-600 text-orange-600 hover:bg-orange-50 shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-explore-businesses">
                  Explore Businesses
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
              {stats.map((stat, index) => (
                <Card key={index} className="border-0 shadow-lg bg-white/70 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-2 text-orange-600">
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Why Choose Baartal?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the future of local commerce with cutting-edge technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  activeFeature === index ? 'ring-2 ring-orange-500 shadow-xl scale-105' : ''
                }`}
                onMouseEnter={() => setActiveFeature(index)}
                data-testid={`feature-card-${index}`}
              >
                <CardHeader className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">How It Works</h2>
            <p className="text-xl text-muted-foreground">Simple steps to start earning and saving</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Sign Up Free",
                description: "Create your account in under 30 seconds. No fees, no commitments.",
                icon: <Users className="w-8 h-8" />
              },
              {
                step: "2", 
                title: "Scan & Earn",
                description: "Shop at partner businesses and scan QR codes to earn B-Coins instantly.",
                icon: <QrCode className="w-8 h-8" />
              },
              {
                step: "3",
                title: "Redeem Rewards",
                description: "Use your B-Coins for discounts, exclusive offers, and real savings.",
                icon: <Award className="w-8 h-8" />
              }
            ].map((step, index) => (
              <div key={index} className="relative text-center group" data-testid={`step-${index}`}>
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 transition-transform duration-300">
                  {step.step}
                </div>
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-lg text-muted-foreground max-w-xs mx-auto">{step.description}</p>
                
                {index < 2 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 w-8 h-8 text-orange-600/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">What Mumbai Says</h2>
            <p className="text-xl text-muted-foreground">Real stories from our community</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300" data-testid={`testimonial-${index}`}>
                <CardHeader>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <CardDescription className="text-lg italic">"{testimonial.content}"</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      <div className="text-xs text-orange-600">{testimonial.location}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Start Earning?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of Mumbai residents already saving money with Baartal
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/register">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-join-now">
                Join Now - It's Free!
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-sign-in">
                Already a Member? Sign In
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>100% Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span>Instant Rewards</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>10,000+ Users</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Baartal
              </h3>
              <p className="text-gray-400 mb-4">Mumbai's premier loyalty platform connecting local businesses with customers.</p>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
                  📱
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
                  📧
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
                  🌐
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/explore" className="hover:text-white transition-colors">Explore Businesses</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Join as Customer</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">List Your Business</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms & Privacy</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Mumbai Areas</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Andheri • Bandra • Juhu</li>
                <li>Powai • Goregaon • Malad</li>
                <li>Thane • Navi Mumbai</li>
                <li><span className="text-orange-400">+ 25 more areas</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Baartal. Made with ❤️ in Mumbai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}