import Navigation from "@/components/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IndianRupee, History } from "lucide-react";

export default function WalletPage() {
  const { data: balanceData } = useQuery<{ balance: number }>({ queryKey: ["/api/bcoin-balance/my"] });
  const { data: transactions = [] } = useQuery<any[]>({ queryKey: ["/api/bcoin-transactions/my"] });

  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-baartal-blue mb-6">My Wallet</h1>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-baartal-blue flex items-center">
                <IndianRupee className="h-6 w-6 mr-1" /> {(balanceData?.balance ?? 0).toFixed(2)}
              </div>
              <div className="mt-4 flex gap-2">
                <Button className="bg-baartal-orange text-white" onClick={() => (window.location.href = '/customer-dashboard')}>Use Prebucks</Button>
                <Button variant="outline" onClick={() => (window.location.href = '/offers')}>Find Offers</Button>
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center"><History className="h-5 w-5 mr-2" /> Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 15).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div>
                      <div className="font-medium">{t.description}</div>
                      <div className="text-sm text-gray-600">{new Date(t.createdAt).toLocaleString()}</div>
                    </div>
                    <div className={`font-semibold ${t.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'earned' ? '+' : '-'}₹{t.amount}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


