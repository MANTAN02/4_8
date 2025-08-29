import { useState } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Building2, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Eye, 
  EyeOff, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Gift,
  Star,
  Shield
} from "lucide-react";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  userType: z.enum(["customer", "business"]),
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    userType: "customer" as "customer" | "business",
    termsAccepted: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      return apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Welcome to Prebucks! 🎉",
        description: `Account created successfully. ${formData.userType === 'customer' ? 'You received 200 Prebucks as signup bonus!' : 'Your business is pending verification.'}`,
      });
      setLocation(formData.userType === "customer" ? "/dashboard" : "/business-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    try {
      registerSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      registerMutation.mutate(formData);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setFormData(prev => ({ 
      ...prev, 
      userType: value as "customer" | "business" 
    }));
  };

  const benefits = {
    customer: [
      { icon: <Gift className="w-4 h-4" />, text: "200 Prebucks signup bonus" },
      { icon: <Star className="w-4 h-4" />, text: "Earn 5-12% on every purchase" },
      { icon: <MapPin className="w-4 h-4" />, text: "500+ partner businesses" },
      { icon: <Shield className="w-4 h-4" />, text: "Secure & instant rewards" }
    ],
    business: [
      { icon: <User className="w-4 h-4" />, text: "Increase customer retention" },
      { icon: <TrendingUp className="w-4 h-4" />, text: "40% average revenue growth" },
      { icon: <BarChart3 className="w-4 h-4" />, text: "Advanced analytics dashboard" },
      { icon: <CheckCircle className="w-4 h-4" />, text: "Free verification & listing" }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <div className="flex items-center justify-center mb-4 cursor-pointer group">
              <img 
                src="/attached_assets/image_1754320645449.png" 
                alt="Prebucks Logo" 
                className="w-12 h-12 mr-3 group-hover:scale-110 transition-transform"
              />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Prebucks
              </h1>
            </div>
          </Link>
          <p className="text-muted-foreground">Join Mumbai's fastest-growing loyalty platform</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Choose your account type and start saving today
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Account Type Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger 
                  value="customer" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Customer
                </TabsTrigger>
                <TabsTrigger 
                  value="business" 
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Business
                </TabsTrigger>
              </TabsList>

              {/* Benefits Display */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  {activeTab === 'customer' ? <Gift className="w-4 h-4 text-blue-600" /> : <Building2 className="w-4 h-4 text-purple-600" />}
                  {activeTab === 'customer' ? 'Customer Benefits' : 'Business Benefits'}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {benefits[activeTab as keyof typeof benefits].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`${activeTab === 'customer' ? 'text-blue-600' : 'text-purple-600'}`}>
                        {benefit.icon}
                      </div>
                      <span>{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <TabsContent value="customer" className="space-y-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer-name">Full Name *</Label>
                      <Input
                        id="customer-name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Your full name"
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer-phone">Phone</Label>
                      <Input
                        id="customer-phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer-email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="customer-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your@email.com"
                        className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer-password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="customer-password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Create a strong password"
                        className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                    <p className="text-xs text-gray-500">Must be 8+ characters with uppercase, lowercase, number & special character</p>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => handleInputChange('termsAccepted', checked)}
                    />
                    <Label className="text-sm leading-5">
                      I agree to the{' '}
                      <Button 
                        variant="link" 
                        className="px-0 h-auto text-orange-600 hover:text-orange-700"
                        onClick={() => setLocation('/privacy')}
                      >
                        Terms of Service
                      </Button>
                      {' '}and{' '}
                      <Button 
                        variant="link" 
                        className="px-0 h-auto text-orange-600 hover:text-orange-700"
                        onClick={() => setLocation('/privacy')}
                      >
                        Privacy Policy
                      </Button>
                    </Label>
                  </div>
                  {errors.termsAccepted && <p className="text-xs text-red-600">{errors.termsAccepted}</p>}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating Account...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        Create Account & Get 200 Prebucks
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="business" className="space-y-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Full Name *</Label>
                    <Input
                      id="business-name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Your full name"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business-email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="business-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="business@email.com"
                        className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business-phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="business-phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business-password">Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="business-password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Create a strong password"
                        className={`pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => handleInputChange('termsAccepted', checked)}
                    />
                    <Label className="text-sm leading-5">
                      I agree to the{' '}
                      <Button 
                        variant="link" 
                        className="px-0 h-auto text-orange-600 hover:text-orange-700"
                        onClick={() => setLocation('/privacy')}
                      >
                        Terms of Service
                      </Button>
                      {' '}and understand that business verification is required
                    </Label>
                  </div>
                  {errors.termsAccepted && <p className="text-xs text-red-600">{errors.termsAccepted}</p>}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating Account...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Register Business
                      </div>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button 
                  variant="link" 
                  className="px-0 font-medium text-orange-600 hover:text-orange-700" 
                  onClick={() => setLocation('/login')}
                >
                  Sign in
                </Button>
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex justify-center gap-4 text-sm pt-4 border-t">
              <Button 
                variant="link" 
                className="px-0 text-gray-600 hover:text-orange-600"
                onClick={() => setLocation('/about')}
              >
                About
              </Button>
              <Button 
                variant="link" 
                className="px-0 text-gray-600 hover:text-orange-600"
                onClick={() => setLocation('/faq')}
              >
                FAQ
              </Button>
              <Button 
                variant="link" 
                className="px-0 text-gray-600 hover:text-orange-600"
                onClick={() => setLocation('/contact')}
              >
                Support
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            Your information is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}