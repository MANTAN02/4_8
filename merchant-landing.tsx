import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import MerchantBenefits from "@/components/merchant-benefits";

export default function MerchantLanding() {
  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-baartal-blue mb-3">Prebucks for Merchants</h1>
        <p className="text-gray-600 mb-8">Increase footfall, reward loyalty, and get payouts while customers save with Prebucks.</p>
        <MerchantBenefits />
      </div>
      <Footer />
    </div>
  );
}


