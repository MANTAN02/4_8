import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  QrCode, 
  Plus, 
  Copy, 
  Download,
  Trash2,
  Eye,
  Share2,
  Printer,
  RefreshCw,
  BarChart3,
  Calendar,
  Users
} from "lucide-react";

interface QRCodeData {
  id: string;
  businessId: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  usageCount?: number;
  lastUsed?: string;
}

interface Business {
  id: string;
  businessName: string;
  category: string;
  bCoinRate: string;
}

export default function QRCodes() {
  const [, setLocation] = useLocation();
  const { data: user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);

  // Check authentication
  if (!user || user.userType !== "business") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">QR code management is only available for businesses.</p>
          <Button onClick={() => setLocation('/business-login')}>Go to Business Login</Button>
        </div>
      </div>
    );
  }

  const { data: businesses, isLoading: businessesLoading } = useQuery<Business[]>({
    queryKey: ["/api/businesses/my"],
    enabled: !!user && user.userType === "business",
  });

  const selectedBusiness = businesses?.[0];

  const { data: qrCodes = [], isLoading: qrCodesLoading, refetch } = useQuery<QRCodeData[]>({
    queryKey: [`/api/businesses/${selectedBusiness?.id}/qr-codes`],
    enabled: !!selectedBusiness,
  });

  const { data: qrAnalytics } = useQuery({
    queryKey: [`/api/qr-codes/analytics/${selectedBusiness?.id}`],
    enabled: !!selectedBusiness,
  });

  const createQRMutation = useMutation({
    mutationFn: async (data: { businessId: string; description: string }) => {
      return apiRequest("/api/qr-codes", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "QR Code Created! 🎉",
        description: "Your new QR code is ready for customers to scan.",
      });
      setDescription("");
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${selectedBusiness?.id}/qr-codes`] });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create QR code",
        variant: "destructive",
      });
    },
  });

  const deleteQRMutation = useMutation({
    mutationFn: async (qrCodeId: string) => {
      return apiRequest(`/api/qr-codes/${qrCodeId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "QR Code Deleted ✅",
        description: "QR code has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${selectedBusiness?.id}/qr-codes`] });
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete QR code",
        variant: "destructive",
      });
    },
  });

  const toggleQRStatusMutation = useMutation({
    mutationFn: async ({ qrCodeId, isActive }: { qrCodeId: string; isActive: boolean }) => {
      return apiRequest(`/api/qr-codes/${qrCodeId}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "QR code status has been updated",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${selectedBusiness?.id}/qr-codes`] });
    },
  });

  const handleCreateQR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a description for the QR code",
        variant: "destructive",
      });
      return;
    }

    createQRMutation.mutate({
      businessId: selectedBusiness.id,
      description: description.trim(),
    });
  };

  const copyQRCodeId = (qrCodeId: string) => {
    navigator.clipboard.writeText(qrCodeId);
    toast({
      title: "Copied! 📋",
      description: "QR code ID copied to clipboard",
    });
  };

  const generateQRCodeSVG = (qrCodeId: string) => {
    const size = 200;
    const cellSize = size / 25;
    
    const pattern: boolean[][] = [];
    for (let i = 0; i < 25; i++) {
      pattern[i] = [];
      for (let j = 0; j < 25; j++) {
        const seed = qrCodeId.charCodeAt((i * 25 + j) % qrCodeId.length);
        pattern[i][j] = (seed + i + j) % 3 === 0;
      }
    }

    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;
    
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        if (pattern[i][j]) {
          svg += `<rect x="${j * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
        }
      }
    }
    
    svg += `<text x="${size/2}" y="${size - 10}" text-anchor="middle" fill="black" font-size="8" font-family="monospace">${qrCodeId.substring(0, 12)}...</text>`;
    svg += '</svg>';
    return svg;
  };

  const downloadQRCode = (qrCodeId: string, description: string) => {
    const svg = generateQRCodeSVG(qrCodeId);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prebucks-qr-${description.replace(/\s+/g, '-').toLowerCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded! 📥",
      description: "QR code saved to your device",
    });
  };

  const printQRCode = (qrCode: QRCodeData) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const svg = generateQRCodeSVG(qrCode.id);
      printWindow.document.write(`
        <html>
          <head>
            <title>Prebucks QR Code - ${qrCode.description}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              .qr-container { margin: 20px auto; }
              .business-info { margin-bottom: 20px; }
              .instructions { margin-top: 20px; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="business-info">
              <h1>${selectedBusiness?.businessName}</h1>
              <h2>Scan & Pay with Prebucks</h2>
              <p>Earn ${selectedBusiness?.bCoinRate}% Prebucks on every purchase</p>
            </div>
            <div class="qr-container">
              ${svg}
            </div>
            <div class="instructions">
              <p>1. Open Prebucks app</p>
              <p>2. Scan this QR code</p>
              <p>3. Enter bill amount</p>
              <p>4. Earn Prebucks instantly!</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (businessesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!selectedBusiness) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Business Found</h1>
          <p className="text-gray-600 mb-6">Please create a business profile first to manage QR codes.</p>
          <Button onClick={() => setLocation("/business-dashboard")}>
            Go to Business Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">QR Code Management</h1>
            <p className="text-gray-600 mt-2">Create and manage QR codes for {selectedBusiness.businessName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              disabled={qrCodesLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${qrCodesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create QR Code
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-lg font-bold">{qrCodes.length}</div>
                  <div className="text-xs text-gray-600">Total QR Codes</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-lg font-bold">{qrCodes.filter(qr => qr.isActive).length}</div>
                  <div className="text-xs text-gray-600">Active Codes</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-lg font-bold">{qrAnalytics?.totalScans || 0}</div>
                  <div className="text-xs text-gray-600">Total Scans</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                <div>
                  <div className="text-lg font-bold">₹{qrAnalytics?.totalRevenue || 0}</div>
                  <div className="text-xs text-gray-600">Revenue Generated</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create QR Code Form */}
        {showCreateForm && (
          <Card className="mb-8 border-orange-200 border-2">
            <CardHeader>
              <CardTitle className="text-orange-700">Create New QR Code</CardTitle>
              <CardDescription>Generate a new QR code for customer transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateQR} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">QR Code Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Main Counter, Takeaway Orders, VIP Section"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    This helps you identify where the QR code is used and track performance
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 mb-2">QR Code Features</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Customers earn {selectedBusiness.bCoinRate}% Prebucks on every scan</li>
                    <li>• Real-time transaction notifications</li>
                    <li>• Detailed analytics and usage tracking</li>
                    <li>• Secure and encrypted transactions</li>
                  </ul>
                </div>

                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={createQRMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {createQRMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <LoadingSpinner size="sm" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <QrCode className="w-4 h-4" />
                        <span>Generate QR Code</span>
                      </div>
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setDescription("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* QR Codes List */}
        {qrCodesLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : qrCodes && qrCodes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrCodes.map((qrCode) => (
              <Card key={qrCode.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate text-lg">{qrCode.description}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={qrCode.isActive ? "default" : "secondary"}>
                        {qrCode.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedQR(qrCode)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span>Created {new Date(qrCode.createdAt).toLocaleDateString()}</span>
                    {qrCode.usageCount && (
                      <span className="text-green-600 font-medium">{qrCode.usageCount} scans</span>
                    )}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* QR Code Visual */}
                    <div className="flex justify-center">
                      <div 
                        className="border-2 border-gray-200 rounded-lg p-4 bg-white hover:border-orange-300 transition-colors cursor-pointer"
                        onClick={() => copyQRCodeId(qrCode.id)}
                        title="Click to copy QR code ID"
                      >
                        <div
                          dangerouslySetInnerHTML={{ 
                            __html: generateQRCodeSVG(qrCode.id) 
                          }}
                          className="w-32 h-32"
                        />
                      </div>
                    </div>

                    {/* QR Code ID */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">QR Code ID</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={qrCode.id}
                          readOnly
                          className="text-xs font-mono bg-gray-50"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyQRCodeId(qrCode.id)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Usage Stats */}
                    {qrCode.lastUsed && (
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Last used: {new Date(qrCode.lastUsed).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadQRCode(qrCode.id, qrCode.description)}
                        className="flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => printQRCode(qrCode)}
                        className="flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" />
                        Print
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleQRStatusMutation.mutate({ 
                          qrCodeId: qrCode.id, 
                          isActive: !qrCode.isActive 
                        })}
                        disabled={toggleQRStatusMutation.isPending}
                        className={qrCode.isActive ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}
                      >
                        {qrCode.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteQRMutation.mutate(qrCode.id)}
                        disabled={deleteQRMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No QR Codes Yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first QR code to start accepting Prebucks transactions from customers.
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First QR Code
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Usage Instructions */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
              <Eye className="mr-2 h-4 w-4" />
              How to Use Your QR Codes
            </h4>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-blue-800">
              <div>
                <h5 className="font-medium mb-2">For Physical Display:</h5>
                <ul className="space-y-1">
                  <li>• Print and display at checkout counter</li>
                  <li>• Place on tables for restaurant orders</li>
                  <li>• Add to business cards and flyers</li>
                  <li>• Show on tablet or phone screen</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium mb-2">Customer Experience:</h5>
                <ul className="space-y-1">
                  <li>• Customer scans with Prebucks app</li>
                  <li>• They enter their bill amount</li>
                  <li>• Prebucks are earned automatically</li>
                  <li>• You get real-time notifications</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}