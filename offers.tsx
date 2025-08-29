import Navigation from "@/components/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, Loader2 } from "lucide-react";

export default function Offers() {
  const { data: offers = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/offers"],
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [pincode, setPincode] = useState("");
  const filtered = offers.filter((b: any) => (
    (!search || (b.businessName || '').toLowerCase().includes(search.toLowerCase())) &&
    (!category || b.category === category) &&
    (!pincode || (b.pincode || '').includes(pincode))
  ));

  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-baartal-blue mb-6">Latest Offers</h1>
        <div className="flex items-center gap-3 mb-6">
          <input className="border rounded px-3 py-2 w-full md:w-1/3" placeholder="Search shops..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className="border rounded px-3 py-2 w-40" placeholder="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} />
          <select className="border rounded px-3 py-2 w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            <option value="restaurant">Restaurant</option>
            <option value="cafe">Cafe</option>
            <option value="clothes">Clothes</option>
            <option value="salon">Salon</option>
          </select>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-600">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading offers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No offers yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((b: any) => (
              <Card key={b.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg text-baartal-blue flex items-center justify-between">
                    {b.businessName}
                    <Badge className="bg-baartal-orange text-white">{b.bCoinRate}% Prebucks</Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600">{b.category} · {b.pincode}</p>
                </CardHeader>
                <CardContent>
                  <Button className="bg-baartal-blue text-white" onClick={() => (window.location.href = '/customer-dashboard')}>Pay with Prebucks</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


