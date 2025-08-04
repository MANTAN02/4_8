import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface QRScannerProps {
  customerId: string;
  onScanComplete?: (transaction: any) => void;
}

export default function QRScanner({ customerId, onScanComplete }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [step, setStep] = useState<'scan' | 'amount'>('scan');
  const [scannedCode, setScannedCode] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const scanMutation = useMutation({
    mutationFn: async (data: { qrCode: string; customerId: string; billAmount: string }) => {
      const response = await apiRequest("POST", "/api/scan-qr", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: `Earned ${data.bCoinsEarned} B-Coins from ${data.business.businessName}!`,
      });
      stopCamera();
      setStep('scan');
      setScannedCode("");
      setBillAmount("");
      setManualCode("");
      onScanComplete?.(data.transaction);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process QR scan",
        variant: "destructive",
      });
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScanning(true);
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a QR code",
        variant: "destructive",
      });
      return;
    }
    setScannedCode(manualCode);
    setStep('amount');
  };

  const handleAmountSubmit = () => {
    if (!billAmount || parseFloat(billAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid bill amount",
        variant: "destructive",
      });
      return;
    }
    
    scanMutation.mutate({
      qrCode: scannedCode,
      customerId,
      billAmount
    });
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  if (step === 'amount') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-baartal-blue mb-2">Enter Bill Amount</h3>
          <p className="text-gray-600">How much did you spend at this store?</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="billAmount">Bill Amount (₹)</Label>
            <Input
              id="billAmount"
              type="number"
              placeholder="Enter amount"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              className="text-lg"
            />
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setStep('scan');
                setScannedCode("");
              }}
              className="flex-1"
            >
              Back
            </Button>
            <Button 
              onClick={handleAmountSubmit}
              disabled={scanMutation.isPending}
              className="flex-1 bg-baartal-orange hover:bg-orange-600"
            >
              {scanMutation.isPending ? "Processing..." : "Confirm & Earn B-Coins"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-baartal-blue mb-2">Scan QR Code</h3>
        <p className="text-gray-600">Scan the merchant's QR code to earn B-Coins</p>
      </div>

      {isScanning ? (
        <div className="relative">
          <div className="qr-scanner-overlay bg-black rounded-lg">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="qr-scanner-border">
              <div className="qr-scanner-corner top-left"></div>
              <div className="qr-scanner-corner top-right"></div>
              <div className="qr-scanner-corner bottom-left"></div>
              <div className="qr-scanner-corner bottom-right"></div>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            onClick={stopCamera}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-4">Position the QR code within the frame</p>
            <Button
              variant="outline"
              onClick={() => {
                // Simulate QR code detection for demo
                const demoCode = "DEMO_QR_" + Math.random().toString(36).substring(7);
                setScannedCode(demoCode);
                setStep('amount');
                stopCamera();
              }}
              className="text-baartal-orange border-baartal-orange hover:bg-baartal-orange hover:text-white"
            >
              Use Demo Code (for testing)
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Button
            onClick={startCamera}
            className="w-full bg-baartal-orange hover:bg-orange-600 py-3"
          >
            <Camera className="mr-2 h-5 w-5" />
            Start Camera Scan
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="manualCode">Enter QR Code Manually</Label>
            <div className="flex gap-2">
              <Input
                id="manualCode"
                placeholder="Enter QR code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleManualSubmit}
                variant="outline"
                className="border-baartal-orange text-baartal-orange hover:bg-baartal-orange hover:text-white"
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
