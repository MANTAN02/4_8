import { useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Coins, QrCode, Star, TrendingUp, Users, Shield, Zap, Globe, Award, ChevronRight, CheckCircle, Building2, Smartphone, BarChart3 } from 'lucide-react';
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

  const benefits = [
    {
      icon: <Shield className="w-8 h-8 text-orange-600" />,
      title: "Secure & Trusted",
      description: "Bank-grade security with encrypted transactions and verified businesses."
    },
    {
      icon: <Zap className="w-8 h-8 text-orange-600" />,
      title: "Lightning Fast",
      description: "Instant QR code scanning and real-time reward processing."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-orange-600" />,
      title: "Smart Analytics",
      description: "Detailed insights and analytics for both customers and businesses."
    },
    {
      icon: <Building2 className="w-8 h-8 text-orange-600" />,
      title: "Local Focus",
      description: "Supporting Mumbai's local business ecosystem and community growth."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-amber-600/5 dark:from-orange-400/5 dark:to-amber-400/5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-white rounded-2xl shadow-lg border border-orange-100">
                <img 
                  src="/attached_assets/image_1754320645449.png" 
                  alt="Baartal Logo" 
                  className="w-16 h-16 md:w-20 md:h-20 object-contain"
                />
              </div>
            </div>
            <Badge className="mb-6 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 hover:from-orange-200 hover:to-amber-200 border-orange-200 px-4 py-2 text-sm font-semibold" data-testid="badge-beta">
              🚀 Now Live in Mumbai
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 text-gradient-orange leading-tight">
              Mumbai's #1 Loyalty Platform
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
              Earn B-Coins at local businesses, get real rewards, and support your community. 
              <span className="font-semibold text-orange-600"> Join 10,000+ Mumbai residents!</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link href="/register">
                <Button size="lg" className="btn-primary text-lg px-8 py-4 hover-lift" data-testid="button-get-started">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button size="lg" variant="outline" className="btn-secondary text-lg px-8 py-4 hover-lift" data-testid="button-explore">
                  Explore Businesses
                  <Globe className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Bank-grade Security</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Verified Businesses</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-green-600" />
                <span>4.9★ Rated Platform</span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, index) => (
              <div key={index} className="card-professional text-center p-6 hover-lift animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex justify-center mb-3 text-orange-600">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-white to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Why Choose <span className="text-gradient-orange">Baartal?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of local business loyalty with our comprehensive platform designed for Mumbai's vibrant community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {benefits.map((benefit, index) => (
              <div key={index} className="card-professional p-8 text-center hover-lift animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-orange-50 rounded-2xl">
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* Interactive Features */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-gray-900 mb-8">Powerful Features for Everyone</h3>
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className={`p-6 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                    activeFeature === index 
                      ? 'border-orange-200 bg-orange-50 shadow-orange' 
                      : 'border-gray-100 bg-white hover:border-orange-100 hover:bg-orange-50/50'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} text-white`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="relative">
              <div className="card-featured p-8 text-center">
                <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full flex items-center justify-center">
                  <Smartphone className="w-16 h-16 text-orange-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-4">
                  {features[activeFeature].title}
                </h4>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {features[activeFeature].description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Trusted by <span className="text-gradient-orange">Mumbai</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what our community of customers and business owners have to say about their Baartal experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card-professional p-8 hover-lift animate-scale-in" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="flex items-center mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                <div className="border-t border-gray-100 pt-4">
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-orange-600 font-medium">{testimonial.role}</div>
                  <div className="text-sm text-gray-500">{testimonial.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-orange-600 to-amber-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-orange-100 mb-10 max-w-2xl mx-auto">
            Join thousands of Mumbai businesses and customers who are already benefiting from our loyalty platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-semibold text-lg px-8 py-4 hover-lift">
                Start Free Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-orange-600 font-semibold text-lg px-8 py-4 hover-lift">
                Explore Features
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}