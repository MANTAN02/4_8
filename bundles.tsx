import Navigation from "@/components/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin } from "lucide-react";

export default function Bundles() {
  const { data: bundles = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/bundles"],
  });
  const [pincode, setPincode] = useState("");
  const filtered = bundles.filter((b: any) => (!pincode || (b.pincode || '').includes(pincode)));

  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-baartal-blue mb-6">Bundles Near You</h1>
        <div className="flex items-center gap-3 mb-6">
          <input className="border rounded px-3 py-2 w-48" placeholder="Filter by pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-600">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading bundles...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No bundles yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((bundle: any) => (
              <Card key={bundle.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg text-baartal-blue flex items-center justify-between">
                    {bundle.name}
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {bundle.businesses?.length || 0}/10
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600">Pincode: {bundle.pincode}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(bundle.businesses || []).slice(0, 3).map((biz: any) => (
                      <div key={biz.id} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{biz.businessName}</span>
                        <Badge className="bg-baartal-orange text-white">{biz.bCoinPercentage}%</Badge>
                      </div>
                    ))}
                    {bundle.businesses?.length > 3 && (
                      <p className="text-xs text-gray-500">+{bundle.businesses.length - 3} more</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


