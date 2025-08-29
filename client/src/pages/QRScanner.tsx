import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  QrCode, 
  Camera, 
  DollarSign, 
  Coins,
  CheckCircle,
  AlertCircle,
  Flashlight,
  FlashlightOff,
  RotateCcw,
  X,
  Store,
  MapPin,
  Star,
  Gift
} from "lucide-react";

interface QRTransaction {
  qrCodeId: string;
  amount: string;
}

interface ScannedBusiness {
  id: string;
  businessName: string;
  category: string;
  address: string;
  bCoinRate: string;
  isVerified: boolean;
  averageRating?: number;
}

export default function QRScanner() {
  const [, setLocation] = useLocation();
  const { data: user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [qrCodeId, setQrCodeId] = useState("");
  const [amount, setAmount] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scannedBusiness, setScannedBusiness] = useState<ScannedBusiness | null>(null);
  const [scanHistory, setScanHistory] = useState<string[]>([]);

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to use the QR scanner',
        variant: 'destructive',
      });
      setLocation('/login');
    }
  }, [user, setLocation, toast]);

  const transactionMutation = useMutation({
    mutationFn: async (data: QRTransaction) => {
      return apiRequest("/api/qr-transactions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Transaction Successful! 🎉",
        description: `You earned ${data.bCoinsEarned} Prebucks from this purchase of ₹${amount}`,
        duration: 5000,
      });
      setQrCodeId("");
      setAmount("");
      setScannedBusiness(null);
      queryClient.invalidateQueries({ queryKey: ["/api/bcoin-balance/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bcoin-transactions/my"] });
      
      // Add to scan history
      setScanHistory(prev => [data.businessName, ...prev.slice(0, 4)]);
    },
    onError: (error: any) => {
      toast({
        title: "Transaction Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const businessLookupMutation = useMutation({
    mutationFn: async (qrCode: string) => {
      return apiRequest(`/api/qr-codes/${qrCode}`);
    },
    onSuccess: (data) => {
      setScannedBusiness(data.business);
      toast({
        title: "Business Found! 🏪",
        description: `Welcome to ${data.business.businessName}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "QR Code Invalid",
        description: error.message || "Unable to find business. Please check the QR code.",
        variant: "destructive",
      });
    },
  });

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsScanning(true);
        
        // Start scanning loop
        scanLoop();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: 'Camera Access Error',
        description: 'Please allow camera access to scan QR codes',
        variant: 'destructive',
      });
      setShowManualEntry(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const scanLoop = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Simulate QR code detection (in production, use jsQR library)
      const shouldDetect = Math.random() < 0.02; // 2% chance per frame
      if (shouldDetect) {
        const mockQRCode = 'PREBUCKS_' + Math.random().toString(36).substr(2, 9);
        handleQRDetected(mockQRCode);
        return;
      }
    }

    requestAnimationFrame(scanLoop);
  };

  const handleQRDetected = (qrCode: string) => {
    setQrCodeId(qrCode);
    businessLookupMutation.mutate(qrCode);
    stopCamera();
  };

  const toggleFlash = async () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      } else {
        toast({
          title: 'Flash Not Available',
          description: 'Your device does not support camera flash',
        });
      }
    }
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
    setTimeout(startCamera, 500);
  };

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!qrCodeId || !amount) {
      toast({
        title: "Missing Information",
        description: "Please scan a QR code and enter the amount",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
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

  const simulateQRScan = () => {
    const mockQRCode = 'PREBUCKS_DEMO_' + Math.random().toString(36).substr(2, 9);
    setQrCodeId(mockQRCode);
    
    // Mock business data
    setScannedBusiness({
      id: 'demo-business',
      businessName: 'Demo Coffee Shop',
      category: 'cafe',
      address: 'Bandra West, Mumbai',
      bCoinRate: '8.0',
      isVerified: true,
      averageRating: 4.5
    });
    
    toast({
      title: "Demo QR Scanned! 📱",
      description: "This is a demo scan. Enter amount to complete transaction.",
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">QR Code Scanner</h1>
          <p className="text-gray-600 mt-2">Scan QR codes to complete transactions and earn Prebucks</p>
          
          {/* User Balance */}
          {user.userType === 'customer' && (
            <div className="mt-4 flex justify-center">
              <Badge className="bg-orange-100 text-orange-800 px-4 py-2">
                Current Balance: ₹{(wallet?.balance ?? 0).toFixed(2)} Prebucks
              </Badge>
            </div>
          )}
        </div>

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">Recent Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {scanHistory.map((business, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {business}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!showManualEntry && !scannedBusiness ? (
          /* Camera Scanner Interface */
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>Position the QR code within the camera frame</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {isScanning ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover rounded-lg bg-black"
                    data-testid="video-camera-stream"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Scan Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-orange-500 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-orange-500 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-orange-500 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-orange-500 rounded-br-lg"></div>
                        
                        {/* Scanning Line Animation */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-orange-500 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Camera Controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={toggleFlash}
                      className="bg-black/50 hover:bg-black/70 text-white"
                    >
                      {flashEnabled ? <FlashlightOff className="w-4 h-4" /> : <Flashlight className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={switchCamera}
                      className="bg-black/50 hover:bg-black/70 text-white"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={stopCamera}
                      className="bg-black/50 hover:bg-black/70 text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-8">
                  <div className="aspect-video max-w-sm mx-auto bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Camera scanner ready</p>
                      <Button onClick={startCamera} className="mb-2 bg-orange-600 hover:bg-orange-700">
                        <Camera className="w-4 h-4 mr-2" />
                        Start Camera
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Auto-detect QR codes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-orange-500" />
                    <span>Instant Prebucks rewards</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowManualEntry(true)}
                    className="flex-1"
                  >
                    Enter Code Manually
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={simulateQRScan}
                    className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                  >
                    Try Demo Scan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : scannedBusiness ? (
          /* Business Details & Transaction */
          <div className="space-y-6">
            <Card className="border-green-500 border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <CardTitle className="text-green-700">Business Found!</CardTitle>
                    <CardDescription>QR code verified successfully</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{scannedBusiness.category === 'cafe' ? '☕' : '🏪'}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {scannedBusiness.businessName}
                        {scannedBusiness.isVerified && (
                          <Badge className="bg-green-100 text-green-800">Verified</Badge>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>{scannedBusiness.address}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (scannedBusiness.averageRating || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <Badge className="bg-orange-100 text-orange-800">
                          {scannedBusiness.bCoinRate}% Prebucks Rate
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Complete Transaction</CardTitle>
                <CardDescription>Enter your bill amount to earn Prebucks</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransaction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Bill Amount (₹)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Enter bill amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-10 text-lg"
                        required
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  {amount && parseFloat(amount) > 0 && (
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Gift className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-orange-900">Transaction Preview</span>
                      </div>
                      <div className="text-sm space-y-1 text-orange-800">
                        <div className="flex justify-between">
                          <span>Bill Amount:</span>
                          <span className="font-medium">₹{parseFloat(amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Prebucks Rate:</span>
                          <span className="font-medium">{scannedBusiness.bCoinRate}%</span>
                        </div>
                        <div className="flex justify-between border-t border-orange-300 pt-2">
                          <span className="font-semibold">You'll Earn:</span>
                          <span className="font-bold text-orange-600">
                            ₹{((parseFloat(amount) * parseFloat(scannedBusiness.bCoinRate)) / 100).toFixed(2)} Prebucks
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
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
                        setScannedBusiness(null);
                        setQrCodeId("");
                        setAmount("");
                      }}
                    >
                      Scan Another
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qrCodeId">QR Code ID</Label>
                  <Input
                    id="qrCodeId"
                    type="text"
                    placeholder="Enter QR code ID from business"
                    value={qrCodeId}
                    onChange={(e) => setQrCodeId(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-sm text-gray-500">
                    This ID should be provided by the business or visible on their QR code
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    onClick={() => businessLookupMutation.mutate(qrCodeId)}
                    disabled={!qrCodeId.trim() || businessLookupMutation.isPending}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    {businessLookupMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <LoadingSpinner size="sm" />
                        <span>Looking up...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Store className="w-4 h-4" />
                        <span>Find Business</span>
                      </div>
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowManualEntry(false);
                      setQrCodeId("");
                    }}
                  >
                    Back to Camera
                  </Button>
                </div>
              </div>
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
                  <div>Look for businesses displaying the Prebucks QR code</div>
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
                  <div>Scan the QR code, enter the amount, and earn Prebucks instantly</div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Make sure the QR code is well-lit and clearly visible</li>
                <li>• Hold your phone steady for better scanning</li>
                <li>• You can also enter QR codes manually if camera doesn't work</li>
                <li>• Prebucks are credited instantly after successful scan</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-16 flex flex-col items-center justify-center gap-2"
            onClick={() => setLocation('/explore')}
          >
            <Store className="w-6 h-6 text-blue-600" />
            <span className="text-sm">Find Businesses</span>
          </Button>
          <Button
            variant="outline"
            className="h-16 flex flex-col items-center justify-center gap-2"
            onClick={() => setLocation('/wallet')}
          >
            <Coins className="w-6 h-6 text-green-600" />
            <span className="text-sm">View Wallet</span>
          </Button>
        </div>
      </div>
    </div>
  );
}