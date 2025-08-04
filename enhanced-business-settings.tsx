import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Save, Upload, Star, Percent, Store } from "lucide-react";
import { BUSINESS_CATEGORIES } from "@/lib/constants";

interface BusinessSettingsProps {
  business: any;
  userId: string;
}

export default function EnhancedBusinessSettings({ business, userId }: BusinessSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [businessForm, setBusinessForm] = useState({
    businessName: business?.businessName || "",
    description: business?.description || "",
    address: business?.address || "",
    bCoinPercentage: business?.bCoinPercentage || "5.00",
    isFeatured: business?.isFeatured || false,
    isActive: business?.isActive !== false,
  });

  const updateBusinessMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/businesses/${business?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Business Updated!",
        description: "Your business information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/businesses/user", userId] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update business information. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessMutation.mutate(businessForm);
  };

  const handleInputChange = (field: string, value: any) => {
    setBusinessForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Business Status Card */}
      <Card className="border-baartal-orange border-2">
        <CardHeader>
          <CardTitle className="text-baartal-blue flex items-center">
            <Store className="mr-2 h-5 w-5" />
            Business Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Business Active</h4>
              <p className="text-sm text-gray-600">Allow customers to earn B-Coins at your business</p>
            </div>
            <Switch
              checked={businessForm.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold flex items-center">
                <Star className="mr-1 h-4 w-4 text-yellow-500" />
                Featured Business
              </h4>
              <p className="text-sm text-gray-600">Get priority visibility in customer searches</p>
            </div>
            <Switch
              checked={businessForm.isFeatured}
              onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
            />
          </div>

          <div className="bg-baartal-cream p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Bundle Status:</span>
              <Badge variant={business?.bundleId ? "default" : "secondary"}>
                {business?.bundleId ? "In Bundle" : "Not in Bundle"}
              </Badge>
            </div>
            <p className="text-xs text-gray-600">
              {business?.bundleId ? 
                "Your business is part of a local bundle. Customers can earn B-Coins and spend them across bundle partners." :
                "Join a bundle to participate in the cross-business B-Coin network."
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Business Information Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-baartal-blue flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={businessForm.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Enter your business name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={business?.category} disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Category cannot be changed after registration</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                value={businessForm.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your business, products, and services..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Textarea
                id="address"
                value={businessForm.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your complete business address..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bCoinPercentage" className="flex items-center">
                <Percent className="mr-1 h-4 w-4" />
                B-Coin Reward Percentage
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="bCoinPercentage"
                  type="number"
                  min="1"
                  max="20"
                  step="0.1"
                  value={businessForm.bCoinPercentage}
                  onChange={(e) => handleInputChange('bCoinPercentage', e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">% of bill amount as B-Coins</span>
              </div>
              <p className="text-xs text-gray-500">
                Customers earn this percentage of their bill amount as B-Coins. Recommended: 3-8%
              </p>
            </div>

            <div className="pt-4 border-t">
              <Button
                type="submit"
                disabled={updateBusinessMutation.isPending}
                className="w-full bg-baartal-orange hover:bg-orange-600"
              >
                {updateBusinessMutation.isPending ? (
                  "Updating..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Business Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-baartal-blue flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Business Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-600 mb-2">Upload Business Photos</h4>
            <p className="text-gray-500 mb-4">Add photos of your business to attract more customers</p>
            <Button variant="outline" className="border-baartal-orange text-baartal-orange hover:bg-baartal-orange hover:text-white">
              Choose Photos
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Supported formats: JPG, PNG, WebP. Maximum size: 5MB per image.
          </p>
        </CardContent>
      </Card>

      {/* Business Analytics Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-baartal-blue">Analytics & Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Daily Summary Email</h4>
              <p className="text-sm text-gray-600">Receive daily analytics and B-Coin transaction summary</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">New Customer Alerts</h4>
              <p className="text-sm text-gray-600">Get notified when new customers visit your business</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Low Rating Alerts</h4>
              <p className="text-sm text-gray-600">Be alerted when you receive ratings below 3 stars</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}