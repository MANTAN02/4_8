import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import HeroSection from "@/components/hero-section";
import HowItWorks from "@/components/how-it-works";
import BCoinsSection from "@/components/bcoins-section";

export default function UserLanding() {
  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      <div className="pt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-baartal-blue mb-2">Prebucks for Shoppers</h1>
          <p className="text-gray-600 mb-6">Earn Prebucks as cashback and redeem them at any partner store.</p>
        </div>
        <HeroSection />
        <HowItWorks />
        <BCoinsSection />
      </div>
      <Footer />
    </div>
  );
}


