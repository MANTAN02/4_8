import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  QrCode, 
  Camera, 
  DollarSign, 
  Coins,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface QRTransaction {
  qrCodeId: string;
  amount: string;
}

export default function QRScanner() {
  const [qrCodeId, setQrCodeId] = useState("");
  const [amount, setAmount] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const transactionMutation = useMutation({
    mutationFn: async (data: QRTransaction) => {
      return apiRequest("/api/qr-transactions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Transaction Successful!",
        description: `You earned ${data.bCoinsEarned} B-Coins from this purchase of ₹${amount}`,
      });
      setQrCodeId("");
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/bcoin-balance/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bcoin-transactions/my"] });
    },
    onError: (error) => {
      toast({
        title: "Transaction Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!qrCodeId || !amount) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    transactionMutation.mutate({
      qrCodeId,
      amount,
    });
  };

  const startCamera = () => {
    // In a real app, this would use a camera library like react-qr-reader
    toast({
      title: "Camera Scanner",
      description: "Camera QR scanner would be implemented here with a proper library",
    });
    setShowManualEntry(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">QR Code Scanner</h1>
          <p className="text-gray-600 mt-2">Scan QR codes to complete transactions and earn B-Coins</p>
        </div>

        {!showManualEntry ? (
          /* Camera Scanner Interface */
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>Position the QR code within the camera frame</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-8">
                {/* Placeholder for camera view */}
                <div className="aspect-square max-w-sm mx-auto bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Camera view would appear here</p>
                    <Button onClick={startCamera} className="mb-4">
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Auto-detect QR codes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-orange-500" />
                    <span>Instant B-Coin rewards</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => setShowManualEntry(true)}
                  className="w-full"
                >
                  Enter QR Code Manually
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Manual Entry Form */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="w-5 h-5" />
                <span>Manual QR Code Entry</span>
              </CardTitle>
              <CardDescription>Enter the QR code ID and transaction amount manually</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTransaction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qrCodeId">QR Code ID</Label>
                  <Input
                    id="qrCodeId"
                    type="text"
                    placeholder="Enter QR code ID"
                    value={qrCodeId}
                    onChange={(e) => setQrCodeId(e.target.value)}
                    required
                  />
                  <p className="text-sm text-gray-500">
                    This ID should be provided by the business or visible on their QR code
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Transaction Amount (₹)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Preview */}
                {amount && parseFloat(amount) > 0 && (
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-orange-900">Transaction Preview</span>
                    </div>
                    <div className="text-sm space-y-1 text-orange-800">
                      <div>Purchase Amount: ₹{parseFloat(amount).toFixed(2)}</div>
                      <div>Estimated B-Coins: ~{(parseFloat(amount) * 0.05).toFixed(1)} (5% rate)</div>
                      <div className="text-xs text-orange-600 mt-2">
                        * Actual B-Coin rate depends on the business
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={transactionMutation.isPending}
                  >
                    {transactionMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <LoadingSpinner size="sm" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Coins className="w-4 h-4" />
                        <span>Complete Transaction</span>
                      </div>
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowManualEntry(false);
                      setQrCodeId("");
                      setAmount("");
                    }}
                  >
                    Back to Scanner
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">How to Use QR Scanner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <div className="font-medium text-gray-900">Visit a Partner Business</div>
                  <div>Look for businesses displaying the Baartal QR code</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <div className="font-medium text-gray-900">Make Your Purchase</div>
                  <div>Complete your shopping and ask for the QR code transaction</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <div className="font-medium text-gray-900">Scan & Earn</div>
                  <div>Scan the QR code, enter the amount, and earn B-Coins instantly</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}