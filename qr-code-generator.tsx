import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { QrCode, RefreshCw, Download, Copy, Trash2, Plus, Eye } from "lucide-react";

interface QRCodeGeneratorProps {
  businessId: string;
}

export default function QRCodeGenerator({ businessId }: QRCodeGeneratorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: qrCodes = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/qr-codes/business", businessId],
    enabled: !!businessId,
  });

  const createQRMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/qr-codes", {
        businessId,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "QR Code Generated!",
        description: "New QR code created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/qr-codes/business", businessId] });
      setShowCreateForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteQRMutation = useMutation({
    mutationFn: async (qrCodeId: string) => {
      const response = await apiRequest("DELETE", `/api/qr-codes/${qrCodeId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "QR Code Deleted",
        description: "QR code has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/qr-codes/business", businessId] });
    },
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "QR code copied to clipboard.",
    });
  };

  const generateQRCodeSVG = (code: string) => {
    // Simple QR code-like visual representation
    const size = 200;
    const moduleSize = size / 25;
    
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="white"/>
        ${Array.from({ length: 25 }, (_, i) =>
          Array.from({ length: 25 }, (_, j) => {
            const isModule = (i + j + code.length) % 2 === 0;
            return isModule ? 
              `<rect x="${j * moduleSize}" y="${i * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>` 
              : '';
          }).join('')
        ).join('')}
        <text x="${size/2}" y="${size - 10}" text-anchor="middle" fill="black" font-size="8" font-family="monospace">${code}</text>
      </svg>
    `;
  };

  const downloadQR = (code: string) => {
    const svg = generateQRCodeSVG(code);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `baartal-qr-${code}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "QR code downloaded as SVG file.",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse text-center text-gray-500">
            Loading QR codes...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-baartal-blue">QR Code Management</h3>
          <p className="text-sm text-gray-600">Generate and manage QR codes for your business</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-baartal-orange hover:bg-orange-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Generate New QR
        </Button>
      </div>

      {/* Create QR Form */}
      {showCreateForm && (
        <Card className="border-baartal-orange border-2">
          <CardHeader>
            <CardTitle className="text-baartal-blue flex items-center">
              <QrCode className="mr-2 h-5 w-5" />
              Generate New QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-baartal-cream p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                This QR code will allow customers to scan and earn B-Coins when they make purchases at your business.
                Each scan requires the customer to enter their bill amount.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => createQRMutation.mutate()}
                disabled={createQRMutation.isPending}
                className="bg-baartal-orange hover:bg-orange-600"
              >
                {createQRMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate QR Code
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Codes List */}
      {qrCodes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No QR Codes Yet</h3>
            <p className="text-gray-500 mb-4">
              Generate your first QR code to start accepting B-Coin transactions
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-baartal-orange hover:bg-orange-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Generate First QR Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {qrCodes.map((qr: any) => (
            <Card key={qr.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-baartal-blue">
                    QR Code
                  </CardTitle>
                  <Badge variant={qr.isActive ? "default" : "secondary"}>
                    {qr.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* QR Code Visual */}
                <div className="aspect-square bg-white border-2 border-gray-200 rounded-lg p-4 flex items-center justify-center">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: generateQRCodeSVG(qr.code) 
                    }}
                    className="w-full h-full"
                  />
                </div>

                {/* QR Code Details */}
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-gray-500">Code</Label>
                    <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                      {qr.code}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Created</Label>
                    <div className="text-sm text-gray-700">
                      {new Date(qr.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(qr.code)}
                    className="flex-1"
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadQR(qr.code)}
                    className="flex-1"
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteQRMutation.mutate(qr.id)}
                    disabled={deleteQRMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Usage Instructions */}
      {qrCodes.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h4 className="font-semibold text-baartal-blue mb-3 flex items-center">
              <Eye className="mr-2 h-4 w-4" />
              How to Use QR Codes
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>1. Display the QR code at your checkout counter or cash register</p>
              <p>2. Ask customers to scan the code using the Baartal app</p>
              <p>3. Customer enters their bill amount and earns B-Coins automatically</p>
              <p>4. You can print the QR code or show it on a tablet/phone screen</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}