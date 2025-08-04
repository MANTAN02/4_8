import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
import { useLocation } from "wouter";

export default function GetStarted() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [businessForm, setBusinessForm] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    category: "",
    pincode: "",
    termsAccepted: false
  });

  const [customerForm, setCustomerForm] = useState({
    email: "",
    pincode: ""
  });

  const businessSignupMutation = useMutation({
    mutationFn: async (data: any) => {
      // First register user
      const userResponse = await apiRequest("POST", "/api/auth/register", {
        email: data.email,
        password: data.phone, // Using phone as temporary password
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
        pincode: data.pincode
      });
      
      return businessResponse.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Business registered successfully. Please check your email for verification.",
      });
      setLocation("/business-login");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to register business",
        variant: "destructive",
      });
    },
  });

  const customerSignupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/auth/register", {
        email: data.email,
        password: "temp123", // Temporary password
        userType: "customer",
        name: "Customer", // Temporary name
        pincode: data.pincode
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Account created successfully. Please login to continue.",
      });
      setLocation("/customer-login");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const handleBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessForm.termsAccepted) {
      toast({
        title: "Error",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }
    businessSignupMutation.mutate(businessForm);
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    customerSignupMutation.mutate(customerForm);
  };

  return (
    <section className="py-20 bg-baartal-blue text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Get Started with Baartal</h2>
          <p className="text-xl opacity-90">Join Mumbai's growing community of smart local businesses</p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Business Signup */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6 text-center">For Business Owners</h3>
            <form onSubmit={handleBusinessSubmit} className="space-y-6">
              <div>
                <Label className="block text-sm font-medium mb-2">Business Name</Label>
                <Input 
                  type="text" 
                  placeholder="Enter your business name"
                  value={businessForm.businessName}
                  onChange={(e) => setBusinessForm({...businessForm, businessName: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 placeholder-white/60 text-white"
                  required
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2">Owner Name</Label>
                <Input 
                  type="text" 
                  placeholder="Your full name"
                  value={businessForm.ownerName}
                  onChange={(e) => setBusinessForm({...businessForm, ownerName: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 placeholder-white/60 text-white"
                  required
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2">Email</Label>
                <Input 
                  type="email" 
                  placeholder="your@email.com"
                  value={businessForm.email}
                  onChange={(e) => setBusinessForm({...businessForm, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 placeholder-white/60 text-white"
                  required
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2">Contact Number</Label>
                <Input 
                  type="tel" 
                  placeholder="+91 9876543210"
                  value={businessForm.phone}
                  onChange={(e) => setBusinessForm({...businessForm, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 placeholder-white/60 text-white"
                  required
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2">Business Category</Label>
                <Select value={businessForm.category} onValueChange={(value) => setBusinessForm({...businessForm, category: value})}>
                  <SelectTrigger className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2">Pincode</Label>
                <Input 
                  type="text" 
                  placeholder="e.g., 400053"
                  value={businessForm.pincode}
                  onChange={(e) => setBusinessForm({...businessForm, pincode: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 placeholder-white/60 text-white"
                  required
                />
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox 
                  checked={businessForm.termsAccepted}
                  onCheckedChange={(checked) => setBusinessForm({...businessForm, termsAccepted: checked as boolean})}
                />
                <Label className="text-sm opacity-90">I agree to the exclusive bundle system (only 1 business per category per region)</Label>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-baartal-orange text-white py-4 font-semibold hover:bg-orange-600"
                disabled={businessSignupMutation.isPending}
              >
                {businessSignupMutation.isPending ? "Joining..." : "Join Baartal Bundle"}
              </Button>
            </form>
          </div>

          {/* Customer Signup */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6 text-center">For Customers</h3>
            <form onSubmit={handleCustomerSubmit} className="space-y-6">
              <div>
                <Label className="block text-sm font-medium mb-2">Email</Label>
                <Input 
                  type="email" 
                  placeholder="Enter your email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 placeholder-white/60 text-white"
                  required
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-2">Your Area</Label>
                <Input 
                  type="text" 
                  placeholder="Enter your locality or pincode"
                  value={customerForm.pincode}
                  onChange={(e) => setCustomerForm({...customerForm, pincode: e.target.value})}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 placeholder-white/60 text-white"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-baartal-orange text-white py-4 font-semibold hover:bg-orange-600 mb-4"
                disabled={customerSignupMutation.isPending}
              >
                {customerSignupMutation.isPending ? "Creating Account..." : "Discover Bundles Near You"}
              </Button>
              
              <div className="border-t border-white/20 pt-6">
                <h4 className="font-semibold mb-4 text-center">Join Our Community</h4>
                <div className="space-y-3">
                  <Button 
                    type="button"
                    className="w-full bg-green-600 text-white py-3 font-medium hover:bg-green-700 flex items-center justify-center"
                  >
                    <span className="mr-2">📱</span>
                    Join Baartal WhatsApp Channel
                  </Button>
                  <Button 
                    type="button"
                    className="w-full bg-pink-600 text-white py-3 font-medium hover:bg-pink-700 flex items-center justify-center"
                  >
                    <span className="mr-2">📸</span>
                    Follow on Instagram
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
