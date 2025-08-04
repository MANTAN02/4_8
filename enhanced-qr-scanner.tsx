import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { QrCode, Camera, DollarSign, CheckCircle, AlertCircle } from "lucide-react";

interface QRScannerProps {
  customerId: string;
  onScanComplete: () => void;
}

export default function EnhancedQRScanner({ customerId, onScanComplete }: QRScannerProps) {
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const scanMutation = useMutation({
    mutationFn: async (data: { qrCode: string; billAmount: string }) => {
      const response = await apiRequest("POST", "/api/scan-qr", {
        customerId,
        ...data,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setScanResult(data);
      toast({
        title: "Success! 🎉",
        description: `You earned ₹${data.bCoinsEarned.toFixed(2)} B-Coins from ${data.business.businessName}!`,
      });
      onScanComplete();
      setQrCode("");
      setBillAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Scan Failed",
        description: error.message || "Unable to process QR code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScan = () => {
    if (!qrCode.trim() || !billAmount.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both QR code and bill amount.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid bill amount.",
        variant: "destructive",
      });
      return;
    }

    scanMutation.mutate({
      qrCode: qrCode.trim(),
      billAmount: amount.toFixed(2),
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
          <h3 className="text-xl font-bold text-baartal-blue mb-2">Transaction Complete!</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Business:</strong> {scanResult.business.businessName}</p>
            <p><strong>Bill Amount:</strong> ₹{scanResult.transaction.billAmount}</p>
            <p className="text-lg font-bold text-baartal-orange">
              <strong>B-Coins Earned:</strong> ₹{scanResult.bCoinsEarned.toFixed(2)}
            </p>
          </div>
          <Button 
            onClick={() => setScanResult(null)} 
            className="mt-4 bg-baartal-orange hover:bg-orange-600"
          >
            Scan Another QR
          </Button>
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

      {/* Bill Amount Section */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <DollarSign className="h-8 w-8 text-baartal-orange mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-baartal-blue">Bill Amount</h3>
              <p className="text-sm text-gray-600">Enter your total bill amount</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billAmount">Amount (₹)</Label>
              <Input
                id="billAmount"
                type="number"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {billAmount && (
              <div className="bg-baartal-cream p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  Estimated B-Coins to earn: 
                  <span className="font-bold text-baartal-orange ml-1">
                    ₹{(parseFloat(billAmount) * 0.05).toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">(5% of bill)</span>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scan Button */}
      <Button
        onClick={handleScan}
        disabled={!qrCode.trim() || !billAmount.trim() || scanMutation.isPending}
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
            Earn B-Coins
          </>
        )}
      </Button>

      {/* Help Text */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>Show this screen to the merchant to scan their QR code</p>
        <p>You'll earn 5% of your bill amount as B-Coins</p>
      </div>
    </div>
  );
}