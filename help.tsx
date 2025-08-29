import Navigation from "@/components/navigation";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-baartal-blue mb-4">Help & Support</h1>
        <div className="space-y-4 text-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-baartal-blue mb-2">How to earn Prebucks?</h2>
            <p>Scan the shop QR on our website and pay your bill. You’ll earn a percentage of your bill amount as Prebucks.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-baartal-blue mb-2">How to redeem Prebucks?</h2>
            <p>On the customer dashboard, enter your bill and choose how many Prebucks to apply. Pay the net amount by UPI or card.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-baartal-blue mb-2">Merchant onboarding</h2>
            <p>Merchants can register, generate a QR for their shop, and receive payments with real-time analytics.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-baartal-blue mb-2">Contact support</h2>
            <p>Email us at support@prebucks.in</p>
          </div>
        </div>
      </div>
    </div>
  );
}


