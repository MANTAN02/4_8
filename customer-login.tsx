import { useState } from "react";
import { auth } from "./firebase.config";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, User, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { authService } from "@/lib/auth";
import { useLocation, Link } from "wouter";

export default function CustomerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    phone: "",
    pincode: "",
    password: ""
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      authService.setUser(data.user);
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      setLocation("/customer-dashboard");
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
      const response = await apiRequest("POST", "/api/auth/register", {
        ...data,
        userType: "customer"
      });
      return response.json();
    },
    onSuccess: (data) => {
      authService.setUser(data.user);
      toast({
        title: "Welcome to Baartal!",
        description: "Your account has been created successfully.",
      });
      setLocation("/customer-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account",
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
    signupMutation.mutate(signupForm);
  };

  const googleSignInMutation = useMutation({
    mutationFn: async (idToken: string) => {
      const response = await apiRequest("POST", "/api/auth/google", { 
        idToken,
        userType: "customer"
      });
      return response.json();
    },
    onSuccess: (data) => {
      authService.setUser(data.user);
      toast({
        title: "Welcome!",
        description: "Signed in with Google successfully.",
      });
      setLocation("/customer-dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Google Sign-In Failed",
        description: error.message || "Could not sign in with Google.",
        variant: "destructive",
      });
    },
  });

  // Google Sign-In handler
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      googleSignInMutation.mutate(idToken);
    } catch (error: any) {
      toast({
        title: "Google Sign-In Failed",
        description: error.message || "Could not sign in with Google.",
        variant: "destructive",
      });
    }
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
            <CardTitle className="text-xl text-baartal-blue">Shop Local. Barter Better. Earn B-Coins.</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="data-[state=active]:bg-baartal-orange data-[state=active]:text-white">
                  <User className="mr-2 h-4 w-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-baartal-blue data-[state=active]:text-white">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-baartal-orange hover:bg-orange-600 text-white"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Logging in..." : "Login as Customer"}
                  </Button>
                  <Button
                    type="button"
                    className="w-full mt-2 bg-white border border-gray-300 text-baartal-blue hover:bg-gray-100 flex items-center justify-center"
                    onClick={handleGoogleSignIn}
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5 mr-2" />
                    Sign in with Google
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({...signupForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({...signupForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
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
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      type="text"
                      placeholder="Enter your area pincode"
                      value={signupForm.pincode}
                      onChange={(e) => setSignupForm({...signupForm, pincode: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({...signupForm, password: e.target.value})}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-baartal-blue hover:bg-blue-800 text-white"
                    disabled={signupMutation.isPending}
                  >
                    {signupMutation.isPending ? "Creating Account..." : "Register as Customer"}
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
