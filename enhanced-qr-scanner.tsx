import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { QrCode, Camera, DollarSign, CheckCircle, AlertCircle } from "lucide-react";

interface QRScannerProps {
  customerId: string;
  onScanComplete: () => void;
}

export default function EnhancedQRScanner({ customerId, onScanComplete }: QRScannerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [qrCode, setQrCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [billAmount, setBillAmount] = useState("");
  const [prebucksToUse, setPrebucksToUse] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");

  const scanMutation = useMutation({
    mutationFn: async (data: { qrCode: string }) => {
      const response = await apiRequest("POST", "/api/shop/scan-qr", {
        qrCode: data.qrCode,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setScanResult(data);
      toast({
        title: "Shop Found! 🏪",
        description: `Welcome to ${data.shop.name}! You can now pay with Prebucks.`,
      });
      setQrCode("");
    },
    onError: (error: any) => {
      toast({
        title: "QR Code Invalid",
        description: error.message || "Unable to find shop. Please check the QR code.",
        variant: "destructive",
      });
    },
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/shop/pay", {
        shopId: scanResult?.shop?.id,
        billAmount,
        prebucksToUse,
        paymentMethod,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payment Successful",
        description: `Paid ₹${data.payment.cashPaid.toFixed(2)} + ₹${data.payment.prebucksUsed.toFixed(2)} Prebucks. Earned ₹${data.payment.newPrebucksEarned.toFixed(2)}.`,
      });
      // Refresh wallet and transactions
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bcoin-transactions/user", customerId] });
      setBillAmount("");
      setPrebucksToUse("");
      setPaymentMethod("upi");
      setScanResult(null);
      onScanComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScan = () => {
    if (!qrCode.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter the QR code from the shop.",
        variant: "destructive",
      });
      return;
    }

    scanMutation.mutate({
      qrCode: qrCode.trim(),
    });
  };

  const simulateQRScan = () => {
    setIsScanning(true);
    // Simulate camera scanning
    setTimeout(() => {
      setQrCode(`BAARTAL_${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
      setIsScanning(false);
      toast({
        title: "QR Code Scanned!",
        description: "QR code detected. Please enter your bill amount.",
      });
    }, 2000);
  };

  if (scanResult) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-baartal-blue mb-2">Shop Found!</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Shop:</strong> {scanResult.shop.name}</p>
            <p><strong>Category:</strong> {scanResult.shop.category}</p>
            <p><strong>Address:</strong> {scanResult.shop.address}</p>
            <p className="text-lg font-bold text-baartal-orange">
              <strong>Prebucks Rate:</strong> {scanResult.shop.bCoinRate}%
            </p>
          </div>
          <div className="mt-6 text-left space-y-3">
            <div>
              <Label htmlFor="bill">Bill Amount (₹)</Label>
              <Input
                id="bill"
                type="number"
                min="0"
                step="0.01"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                placeholder="e.g., 750"
              />
            </div>
            <div>
              <Label htmlFor="prebucks">Use Prebucks (₹)</Label>
              <Input
                id="prebucks"
                type="number"
                min="0"
                step="0.01"
                value={prebucksToUse}
                onChange={(e) => setPrebucksToUse(e.target.value)}
                placeholder="e.g., 100"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Method:</span>
              <Button type="button" variant={paymentMethod === "upi" ? "default" : "outline"} onClick={() => setPaymentMethod("upi")}>UPI</Button>
              <Button type="button" variant={paymentMethod === "card" ? "default" : "outline"} onClick={() => setPaymentMethod("card")}>Card</Button>
            </div>
            {billAmount && (
              <div className="bg-baartal-cream p-3 rounded-lg text-sm text-gray-700">
                <div>Estimated earn: ₹{((parseFloat(billAmount || "0") * (parseFloat(scanResult.shop.bCoinRate) || 5)) / 100).toFixed(2)}</div>
              </div>
            )}
            <div className="pt-2 space-y-2">
              <Button
                className="w-full bg-baartal-orange hover:bg-orange-600"
                disabled={!billAmount || payMutation.isPending}
                onClick={() => payMutation.mutate()}
              >
                {payMutation.isPending ? "Processing..." : "Confirm & Pay"}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setScanResult(null)} 
                className="w-full"
              >
                Scan Another QR
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* QR Code Input Section */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <QrCode className="h-12 w-12 text-baartal-orange mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-baartal-blue">Scan QR Code</h3>
              <p className="text-sm text-gray-600">Use camera or enter code manually</p>
            </div>

            {/* Camera Simulation Button */}
            <Button
              onClick={simulateQRScan}
              disabled={isScanning || scanMutation.isPending}
              className="w-full bg-baartal-blue hover:bg-blue-800"
            >
              {isScanning ? (
                <>
                  <Camera className="mr-2 h-4 w-4 animate-pulse" />
                  Scanning...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Use Camera to Scan
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or enter manually</span>
              </div>
            </div>

            {/* Manual QR Code Entry */}
            <div className="space-y-2">
              <Label htmlFor="qrCode">QR Code</Label>
              <Input
                id="qrCode"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="Enter QR code from merchant"
                className="font-mono"
              />
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Scan Button */}
      <Button
        onClick={handleScan}
        disabled={!qrCode.trim() || scanMutation.isPending}
        className="w-full bg-baartal-orange hover:bg-orange-600 text-white"
        size="lg"
      >
        {scanMutation.isPending ? (
          <>
            <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Find Shop
          </>
        )}
      </Button>

      {/* Help Text */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>Scan the QR code displayed at the shop to find shop details</p>
        <p>After scanning, you can pay with Prebucks and earn new ones</p>
      </div>
    </div>
  );
}