import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Coins, QrCode, Star, TrendingUp, Users, Shield, Zap, Globe, Award, ChevronRight, CheckCircle, Building2, Smartphone, BarChart3, Play, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [activeFeature, setActiveFeature] = useState(0);
  const [email, setEmail] = useState('');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const { toast } = useToast();

  const newsletterMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
    onSuccess: () => {
      toast({
        title: 'Subscribed Successfully! 🎉',
        description: 'You\'ll be the first to know about new features and offers.',
      });
      setEmail('');
    },
    onError: () => {
      toast({
        title: 'Subscription Failed',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    },
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      newsletterMutation.mutate(email);
    }
  };

  const features = [
    {
      icon: <Coins className="w-6 h-6" />,
      title: "Prebucks Rewards",
      description: "Earn loyalty coins with every purchase. Convert to real savings.",
      color: "from-yellow-500 to-amber-600",
      demo: "Earn 5-12% on every purchase"
    },
    {
      icon: <QrCode className="w-6 h-6" />,
      title: "Instant QR Scanning",
      description: "Quick, secure transactions with mobile camera scanning.",
      color: "from-blue-500 to-cyan-600",
      demo: "Scan & pay in under 3 seconds"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Local Community",
      description: "Connect with verified Mumbai businesses in your area.",
      color: "from-purple-500 to-indigo-600",
      demo: "500+ verified businesses"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Business Growth",
      description: "Advanced analytics and customer insights for businesses.",
      color: "from-green-500 to-emerald-600",
      demo: "40% average revenue increase"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Active Users", icon: <Users className="w-5 h-5" />, growth: "+156%" },
    { number: "500+", label: "Partner Businesses", icon: <Globe className="w-5 h-5" />, growth: "+89%" },
    { number: "₹50L+", label: "Transactions", icon: <TrendingUp className="w-5 h-5" />, growth: "+234%" },
    { number: "4.9★", label: "User Rating", icon: <Star className="w-5 h-5" />, growth: "Excellent" }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Small Business Owner",
      content: "Prebucks increased my customer retention by 300%. The discount currency system is revolutionary!",
      rating: 5,
      location: "Andheri, Mumbai",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Rajesh Kumar",
      role: "Regular Customer",
      content: "I've saved over ₹15,000 using Prebucks. Best platform in Mumbai!",
      rating: 5,
      location: "Bandra, Mumbai",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Meera Patel",
      role: "Restaurant Owner",
      content: "Real-time analytics help me understand my customers better. Revenue up 40%!",
      rating: 5,
      location: "Juhu, Mumbai",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const benefits = [
    {
      icon: <Shield className="w-8 h-8 text-orange-600" />,
      title: "Secure & Trusted",
      description: "Bank-grade security with encrypted transactions and verified businesses.",
      action: () => setLocation('/about')
    },
    {
      icon: <Zap className="w-8 h-8 text-orange-600" />,
      title: "Lightning Fast",
      description: "Instant QR code scanning and real-time reward processing.",
      action: () => setLocation('/register')
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-orange-600" />,
      title: "Smart Analytics",
      description: "Detailed insights and analytics for both customers and businesses.",
      action: () => setLocation('/explore')
    },
    {
      icon: <Building2 className="w-8 h-8 text-orange-600" />,
      title: "Local Focus",
      description: "Supporting Mumbai's local business ecosystem and community growth.",
      action: () => setLocation('/bundles')
    }
  ];

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-amber-600/5 dark:from-orange-400/5 dark:to-amber-400/5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-white rounded-2xl shadow-lg border border-orange-100 hover:scale-105 transition-transform duration-300">
                <img 
                  src="/attached_assets/image_1754320645449.png" 
                  alt="Prebucks Logo" 
                  className="w-16 h-16 md:w-20 md:h-20 object-contain"
                />
              </div>
            </div>
            <Badge className="mb-6 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 hover:from-orange-200 hover:to-amber-200 border-orange-200 px-4 py-2 text-sm font-semibold animate-bounce" data-testid="badge-beta">
              🚀 Now Live in Mumbai
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 text-gradient-orange leading-tight">
              Your discount currency
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-gray-700">
              Mumbai's #1 Loyalty Platform
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
              Earn Prebucks at local businesses, get real discounts, and support your community. 
              <span className="font-semibold text-orange-600"> Join 10,000+ Mumbai residents!</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Button 
                size="lg" 
                className="btn-primary text-lg px-8 py-4 hover-lift group" 
                onClick={() => setLocation('/register')}
                data-testid="button-get-started"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="btn-secondary text-lg px-8 py-4 hover-lift group" 
                onClick={() => setLocation('/explore')}
                data-testid="button-explore"
              >
                Explore Businesses
                <Globe className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2 hover:text-green-600 transition-colors cursor-pointer" onClick={() => setLocation('/about')}>
                <Shield className="w-4 h-4 text-green-600" />
                <span>Bank-grade Security</span>
              </div>
              <div className="flex items-center gap-2 hover:text-green-600 transition-colors cursor-pointer" onClick={() => setLocation('/bundles')}>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Verified Businesses</span>
              </div>
              <div className="flex items-center gap-2 hover:text-green-600 transition-colors cursor-pointer" onClick={() => setLocation('/faq')}>
                <Award className="w-4 h-4 text-green-600" />
                <span>4.9★ Rated Platform</span>
              </div>
            </div>
          </div>

          {/* Interactive Demo Video */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
              {!isVideoPlaying ? (
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=600" 
                    alt="Prebucks Demo" 
                    className="w-full h-64 md:h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Button
                      size="lg"
                      className="bg-white/90 text-orange-600 hover:bg-white hover:scale-105 transition-all duration-300"
                      onClick={() => setIsVideoPlaying(true)}
                    >
                      <Play className="w-6 h-6 mr-2" />
                      Watch How It Works
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Demo Video Coming Soon!</h3>
                  <p className="text-gray-600 mb-6">We're creating an amazing demo video to show you how Prebucks works.</p>
                  <Button onClick={() => setIsVideoPlaying(false)} variant="outline">
                    Back to Image
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="card-professional text-center p-6 hover-lift animate-fade-in cursor-pointer group" 
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setLocation('/about')}
              >
                <div className="flex justify-center mb-3 text-orange-600 group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600 font-medium mb-1">{stat.label}</div>
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                  {stat.growth}
                </Badge>
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
              Why Choose <span className="text-gradient-orange">Prebucks?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of local business loyalty with our comprehensive platform designed for Mumbai's vibrant community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="card-professional p-8 text-center hover-lift animate-slide-up cursor-pointer group" 
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={benefit.action}
              >
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-orange-50 rounded-2xl group-hover:bg-orange-100 transition-colors">
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900 group-hover:text-orange-600 transition-colors">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 mx-auto text-orange-600" />
                </div>
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
                      ? 'border-orange-200 bg-orange-50 shadow-orange transform scale-105' 
                      : 'border-gray-100 bg-white hover:border-orange-100 hover:bg-orange-50/50'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} text-white`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                      <p className="text-gray-600 mb-2">{feature.description}</p>
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        {feature.demo}
                      </Badge>
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
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  {features[activeFeature].description}
                </p>
                <Button 
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                  onClick={() => setLocation('/register')}
                >
                  Try It Now
                </Button>
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
              See what our community of customers and business owners have to say about their Prebucks experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card-professional p-8 hover-lift animate-scale-in group cursor-pointer" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4 group-hover:scale-110 transition-transform"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-orange-600 font-medium">{testimonial.role}</div>
                    <div className="text-sm text-gray-500">{testimonial.location}</div>
                  </div>
                </div>
                <div className="flex items-center mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-orange-100 to-amber-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Stay Updated</h2>
          <p className="text-lg text-gray-700 mb-8">
            Get the latest updates on new businesses, exclusive offers, and platform features.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              required
            />
            <Button 
              type="submit" 
              disabled={newsletterMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {newsletterMutation.isPending ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <p className="text-lg text-gray-600">Everything you need to get started</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setLocation('/register')}>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-blue-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900 mb-2">Join as Customer</h3>
                <p className="text-sm text-gray-600">Start earning Prebucks today</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setLocation('/business-login')}>
              <CardContent className="p-6 text-center">
                <Building2 className="w-12 h-12 text-purple-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900 mb-2">Register Business</h3>
                <p className="text-sm text-gray-600">Grow your customer base</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setLocation('/explore')}>
              <CardContent className="p-6 text-center">
                <MapPin className="w-12 h-12 text-green-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900 mb-2">Find Businesses</h3>
                <p className="text-sm text-gray-600">Discover local partners</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setLocation('/contact')}>
              <CardContent className="p-6 text-center">
                <Phone className="w-12 h-12 text-orange-600 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900 mb-2">Get Support</h3>
                <p className="text-sm text-gray-600">We're here to help</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-orange-600 to-amber-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-xl animate-pulse animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-orange-100 mb-10 max-w-2xl mx-auto">
            Join thousands of Mumbai businesses and customers who are already benefiting from our loyalty platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Button 
              size="lg" 
              className="bg-white text-orange-600 hover:bg-orange-50 font-semibold text-lg px-8 py-4 hover-lift group"
              onClick={() => setLocation('/register')}
            >
              Start Free Today
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white hover:text-orange-600 font-semibold text-lg px-8 py-4 hover-lift group"
              onClick={() => setLocation('/contact')}
            >
              Contact Sales
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap justify-center gap-8 text-orange-100">
            <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer" onClick={() => setLocation('/contact')}>
              <Phone className="w-4 h-4" />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer" onClick={() => window.open('mailto:hello@prebucks.com')}>
              <Mail className="w-4 h-4" />
              <span>hello@prebucks.com</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-xl font-bold mb-4">For Customers</h3>
              <p className="text-gray-300 mb-4">Start earning Prebucks and saving money</p>
              <Button 
                variant="outline" 
                className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                onClick={() => setLocation('/register')}
              >
                Join Now
              </Button>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">For Businesses</h3>
              <p className="text-gray-300 mb-4">Grow your customer base and revenue</p>
              <Button 
                variant="outline" 
                className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                onClick={() => setLocation('/business-login')}
              >
                Register Business
              </Button>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Need Help?</h3>
              <p className="text-gray-300 mb-4">Get support and learn more</p>
              <Button 
                variant="outline" 
                className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                onClick={() => setLocation('/contact')}
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}