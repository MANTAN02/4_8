import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { authService } from "@/lib/auth";

export default function FloatingScan() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const user = authService.getUser();
    setVisible(Boolean(user && user.userType === 'customer'));
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => {
        try { localStorage.setItem('openScanOnDashboard', '1'); } catch {}
        window.location.href = '/customer-dashboard';
      }}
      aria-label="Scan QR"
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 rounded-full shadow-lg bg-baartal-orange hover:bg-orange-600 text-white p-4 md:p-5"
    >
      <QrCode className="h-6 w-6" />
    </button>
  );
}


