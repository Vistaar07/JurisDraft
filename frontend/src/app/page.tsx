import HeroSection from "@/components/home/hero-section";
import HowItWorksSection from "@/components/home/how-it-works";
import PricingSection from "@/components/home/pricing-section";
import CTASection from "@/components/home/cta-section";
import PaymentSuccessHandler from "@/components/home/payment-success-handler";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="relative w-full">
      <Suspense fallback={null}>
        <PaymentSuccessHandler />
      </Suspense>
      <div className="flex flex-col">
        <HeroSection />
        <HowItWorksSection />
        <PricingSection />
        <CTASection />
      </div>
    </div>
  );
}
