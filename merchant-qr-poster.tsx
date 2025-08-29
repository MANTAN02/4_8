import Navigation from "@/components/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

export default function MerchantQRPoster() {
  const { data: qrCodes = [] } = useQuery<any[]>({ queryKey: ["/api/business/qr-codes"] });
  const qr = qrCodes[0];
  const imgUrl = qr ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr.code)}` : '';

  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Printable Shop QR Poster</CardTitle>
          </CardHeader>
          <CardContent>
            {qr ? (
              <div className="text-center">
                <div className="text-2xl font-bold text-baartal-blue mb-2">Scan & Pay with Prebucks</div>
                <img src={imgUrl} alt="Shop QR" className="mx-auto border bg-white" />
                <div className="mt-2 text-gray-600">Show this at your billing counter</div>
                <Button className="mt-4 bg-baartal-orange text-white" onClick={() => window.print()}>
                  Print
                </Button>
              </div>
            ) : (
              <div className="text-gray-600 flex items-center justify-center py-8"><QrCode className="h-6 w-6 mr-2" /> Generate a QR first from the dashboard.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


