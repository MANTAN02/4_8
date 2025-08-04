import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import HowItWorks from "@/components/how-it-works";
import MerchantBenefits from "@/components/merchant-benefits";
import ExploreBundles from "@/components/explore-bundles";
import BCoinsSection from "@/components/bcoins-section";
import Testimonials from "@/components/testimonials";
import GetStarted from "@/components/get-started";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      <HeroSection />
      <HowItWorks />
      <MerchantBenefits />
      <ExploreBundles />
      <BCoinsSection />
      <Testimonials />
      <GetStarted />
      <Footer />
    </div>
  );
}
