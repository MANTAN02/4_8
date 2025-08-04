import { useState, useRef, useEffect } from 'react';
import { Camera, X, Flashlight, FlashlightOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface QRCodeScannerProps {
  onScanSuccess: (data: string) => void;
  onClose: () => void;
}

export function QRCodeScanner({ onScanSuccess, onClose }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();

  const scanMutation = useMutation({
    mutationFn: async (qrCodeId: string) => {
      return apiRequest(`/api/qr-codes/${qrCodeId}/scan`, {
        method: 'POST',
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'QR Code Scanned Successfully! 🎉',
        description: `You earned ${data.bCoinsEarned} B-Coins at ${data.businessName}`,
        duration: 5000,
      });
      onScanSuccess(data);
      stopCamera();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Scan Failed',
        description: error.message || 'Invalid or expired QR code',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

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

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Simple QR code detection (in a real app, you'd use a library like jsQR)
      const qrCodeData = detectQRCode(imageData);
      if (qrCodeData) {
        scanMutation.mutate(qrCodeData);
        return;
      }
    }

    // Continue scanning
    requestAnimationFrame(scanLoop);
  };

  // Simplified QR code detection - in reality, use a proper QR code library
  const detectQRCode = (imageData: ImageData): string | null => {
    // This is a placeholder - implement actual QR code detection
    // For demo purposes, we'll simulate QR code detection
    const shouldDetect = Math.random() < 0.01; // 1% chance per frame
    if (shouldDetect) {
      return 'demo-qr-code-' + Math.random().toString(36).substr(2, 9);
    }
    return null;
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
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative h-full w-full">
        {/* Video Stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          data-testid="video-camera-stream"
        />
        
        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scan Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Scan Frame */}
            <div className="w-64 h-64 border-2 border-white rounded-lg relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-lg"></div>
              
              {/* Scanning Line Animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-orange-500 animate-pulse"></div>
              </div>
            </div>
            
            <p className="text-white text-center mt-4 text-lg">
              Point camera at QR code
            </p>
          </div>
        </div>

        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="bg-black/50 hover:bg-black/70 text-white"
            data-testid="button-close-scanner"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <Card className="bg-black/50 border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm text-center">
                QR Scanner Active
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-8 left-4 right-4 flex justify-center items-center gap-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={toggleFlash}
            className="bg-black/50 hover:bg-black/70 text-white"
            data-testid="button-toggle-flash"
          >
            {flashEnabled ? (
              <FlashlightOff className="w-6 h-6" />
            ) : (
              <Flashlight className="w-6 h-6" />
            )}
          </Button>
          
          <Button
            variant="secondary"
            size="lg"
            onClick={switchCamera}
            className="bg-black/50 hover:bg-black/70 text-white"
            data-testid="button-switch-camera"
          >
            <RotateCcw className="w-6 h-6" />
          </Button>
        </div>

        {/* Scanning Status */}
        {scanMutation.isPending && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  <p>Processing QR Code...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}