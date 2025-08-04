import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Coins, Store, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { authService } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import { BUSINESS_CATEGORIES } from "@/lib/constants";

export default function BusinessLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  const [signupForm, setSignupForm] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    category: "",
    pincode: "",
    address: "",
    password: "",
    termsAccepted: false
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.user.userType !== 'business') {
        toast({
          title: "Access Denied",
          description: "This login is for business accounts only.",
          variant: "destructive",
        });
        return;
      }
      authService.setUser(data.user);
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      setLocation("/merchant-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: any) => {
      // First register user
      const userResponse = await apiRequest("POST", "/api/auth/register", {
        email: data.email,
        password: data.password,
        userType: "business",
        name: data.ownerName,
        phone: data.phone,
        pincode: data.pincode
      });
      
      const user = await userResponse.json();
      
      // Then create business
      const businessResponse = await apiRequest("POST", "/api/businesses", {
        userId: user.user.id,
        businessName: data.businessName,
        ownerName: data.ownerName,
        category: data.category,
        pincode: data.pincode,
        address: data.address
      });
      
      return { user: user.user, business: await businessResponse.json() };
    },
    onSuccess: (data) => {
      authService.setUser(data.user);
      toast({
        title: "Welcome to Baartal!",
        description: "Your business has been registered successfully.",
      });
      setLocation("/merchant-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register business",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the bundle system terms to continue.",
        variant: "destructive",
      });
      return;
    }
    signupMutation.mutate(signupForm);
  };

  return (
    <div className="min-h-screen bg-baartal-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-baartal-blue hover:text-baartal-orange">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center text-2xl font-bold text-baartal-orange mb-2">
              <Coins className="mr-2" />
              Baartal
            </div>
            <CardTitle className="text-xl text-baartal-blue">Business Portal</CardTitle>
            <p className="text-sm text-gray-600">Join Mumbai's local business community</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signup" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signup" className="data-[state=active]:bg-baartal-orange data-[state=active]:text-white">
                  <Store className="mr-2 h-4 w-4" />
                  Register
                </TabsTrigger>
                <TabsTrigger value="login" className="data-[state=active]:bg-baartal-blue data-[state=active]:text-white">
                  Login
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      type="text"
                      placeholder="Enter your business name"
                      value={signupForm.businessName}
                      onChange={(e) => setSignupForm({...signupForm, businessName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerName">Owner Name *</Label>
                    <Input
                      id="ownerName"
                      type="text"
                      placeholder="Enter owner's full name"
                      value={signupForm.ownerName}
                      onChange={(e) => setSignupForm({...signupForm, ownerName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="business@example.com"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm({...signupForm, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Business Category *</Label>
                    <Select value={signupForm.category} onValueChange={(value) => setSignupForm({...signupForm, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your business category" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_CATEGORIES.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.icon} {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      type="text"
                      placeholder="e.g., 400053"
                      value={signupForm.pincode}
                      onChange={(e) => setSignupForm({...signupForm, pincode: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Business Address</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Enter your business address"
                      value={signupForm.address}
                      onChange={(e) => setSignupForm({...signupForm, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a strong password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      checked={signupForm.termsAccepted}
                      onCheckedChange={(checked) => setSignupForm({...signupForm, termsAccepted: checked as boolean})}
                    />
                    <Label className="text-sm leading-5">
                      I agree to be part of the exclusive bundle system where only 1 business per category exists in each region
                    </Label>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-baartal-orange hover:bg-orange-600 text-white"
                    disabled={signupMutation.isPending}
                  >
                    {signupMutation.isPending ? "Registering..." : "Join Baartal Bundle"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-baartal-blue hover:bg-blue-800 text-white"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Logging in..." : "Login to Dashboard"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
