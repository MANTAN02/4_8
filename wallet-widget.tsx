import { useQuery } from "@tanstack/react-query";
import { Wallet, IndianRupee, History, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth";

interface WalletWidgetProps {
  showActions?: boolean;
  onScanClick?: () => void;
}

export default function WalletWidget({ showActions = false, onScanClick }: WalletWidgetProps) {
  const user = authService.getUser();

  const { data } = useQuery<{ balance: number }>({
    queryKey: ["/api/bcoin-balance/my"],
    enabled: Boolean(user && user.userType === "customer"),
  });

  if (!user || user.userType !== "customer") return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white">
        <Wallet className="h-4 w-4 text-baartal-orange" />
        <div className="text-sm text-baartal-blue">
          <div className="leading-none font-semibold flex items-center gap-1">
            <IndianRupee className="h-3 w-3" />{(data?.balance ?? 0).toFixed(2)}
          </div>
          <div className="text-[10px] text-gray-500">Prebucks</div>
        </div>
      </div>

      {showActions && (
        <div className="hidden md:flex items-center gap-2">
          <a href="/customer-dashboard">
            <Button variant="outline" size="sm">
              <History className="h-3.5 w-3.5 mr-1" />
              History
            </Button>
          </a>
          <Button size="sm" className="bg-baartal-orange text-white" onClick={onScanClick}>
            <QrCode className="h-3.5 w-3.5 mr-1" />
            Scan
          </Button>
        </div>
      )}
    </div>
  );
}


