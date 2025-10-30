import Navbar from "@/components/home/navbar";
import HeroSection from "@/components/home/hero-section";
import HowItWorksSection from "@/components/home/how-it-works";
import PricingSection from "@/components/home/pricing-section";
import CTASection from "@/components/home/cta-section";
import Footer from "@/components/home/footer";

export default function Home() {
  return (
    <div className="relative w-full">
      <div className="flex flex-col">
        <Navbar />
        <HeroSection />
        <HowItWorksSection />
        <PricingSection />
        {/* <CTASection /> */}
        {/* <Footer /> */}
      </div>
    </div>
  );
}
