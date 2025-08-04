import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  QrCode, 
  Plus, 
  Copy, 
  Download,
  Trash2
} from "lucide-react";

interface QRCodeData {
  id: string;
  businessId: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface Business {
  id: string;
  businessName: string;
}

export default function QRCodes() {
  const { data: user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [description, setDescription] = useState("");

  const { data: businesses, isLoading: businessesLoading } = useQuery<Business[]>({
    queryKey: ["/api/businesses/my"],
    enabled: !!user && user.userType === "business",
  });

  const selectedBusiness = businesses?.[0];

  const { data: qrCodes, isLoading: qrCodesLoading } = useQuery<QRCodeData[]>({
    queryKey: [`/api/businesses/${selectedBusiness?.id}/qr-codes`],
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
        title: "Success",
        description: "QR code created successfully!",
      });
      setDescription("");
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${selectedBusiness?.id}/qr-codes`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
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
        title: "Success",
        description: "QR code deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/businesses/${selectedBusiness?.id}/qr-codes`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateQR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBusiness || !description.trim()) {
      toast({
        title: "Error",
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
      title: "Copied!",
      description: "QR code ID copied to clipboard",
    });
  };

  const generateQRCodeSVG = (qrCodeId: string) => {
    // Simple QR-like visual representation
    const size = 200;
    const cellSize = size / 25;
    
    // Create a pseudo-random pattern based on the QR code ID
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
    
    svg += '</svg>';
    return svg;
  };

  const downloadQRCode = (qrCodeId: string, description: string) => {
    const svg = generateQRCodeSVG(qrCodeId);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-code-${description.replace(/\s+/g, '-').toLowerCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user || user.userType !== "business") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">QR code management is only available for businesses.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

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
          <Button onClick={() => window.location.href = "/business-dashboard"}>
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
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create QR Code
          </Button>
        </div>

        {/* Create QR Code Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New QR Code</CardTitle>
              <CardDescription>Generate a new QR code for customer transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateQR} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Main Counter, Takeaway Orders, VIP Section"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    This helps you identify where the QR code is used
                  </p>
                </div>

                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={createQRMutation.isPending}
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
              <Card key={qrCode.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{qrCode.description}</span>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      qrCode.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {qrCode.isActive ? "Active" : "Inactive"}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Created {new Date(qrCode.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* QR Code Visual */}
                    <div className="flex justify-center">
                      <div 
                        className="border-2 border-gray-200 rounded-lg p-4 bg-white"
                        dangerouslySetInnerHTML={{ 
                          __html: generateQRCodeSVG(qrCode.id) 
                        }}
                      />
                    </div>

                    {/* QR Code ID */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">QR Code ID</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          value={qrCode.id}
                          readOnly
                          className="text-xs font-mono"
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

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadQRCode(qrCode.id, qrCode.description)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteQRMutation.mutate(qrCode.id)}
                        disabled={deleteQRMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
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
                Create your first QR code to start accepting B-Coin transactions from customers.
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First QR Code
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}