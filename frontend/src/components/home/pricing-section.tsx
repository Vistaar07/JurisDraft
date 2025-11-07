"use client";

import { cn } from "@/lib/utils";
import { containerVariants, itemsVariants } from "@/utils/constants";
import { ArrowRight, CheckIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { MotionDiv, MotionSection } from "../common/motion-wrapper";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type PriceType = {
  name: string;
  price: string | number;
  description: string;
  features: string[];
  isMostPopular: boolean;
  paymentLink?: string;
  priceId?: string;
  isStripePlan?: boolean;
};

const listVariant = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  transition: {
    type: "spring",
    stiffness: 100,
    damping: 20,
  },
};

const PricingCard = ({
  name,
  price,
  description,
  features,
  isMostPopular,
  paymentLink,
  priceId,
  isStripePlan,
}: PriceType) => {
  const [loading, setLoading] = useState(false);
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleSubscribe = async () => {
    // If not a Stripe plan, just navigate to the link
    if (!isStripePlan || !priceId) {
      router.push(paymentLink || "/sign-up");
      return;
    }

    // Check if user is signed in
    if (!isSignedIn) {
      toast.error("Please sign in to subscribe");
      router.push("/sign-in");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          planName: name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to start checkout. Please try again.");
      setLoading(false);
    }
  };

  return (
    <MotionDiv
      variants={listVariant}
      whileHover={{ scale: 1.02 }}
      className="relative w-full max-w-lg hover:scale-105 hover:transition-all duration-300"
    >
      <div
        className={cn(
          "relative flex flex-col h-full gap-4 lg:gap-8 z-10 p-8 border border-gray-500/20 rounded-2xl bg-white",
          isMostPopular && "border-rose-500 gap-5 border-2"
        )}
      >
        <MotionDiv
          variants={listVariant}
          className="flex justify-between items-center gap-4"
        >
          <div>
            <p className="text-lg lg:text-xl font-bold capitalize">{name}</p>
            <p className="text-gray-600 mt-2">{description}</p>
          </div>
        </MotionDiv>
        <MotionDiv variants={listVariant} className="flex gap-2">
          {typeof price === "number" ? (
            <>
              <p className="text-5xl tracking-tight font-extrabold">${price}</p>
              <div className="flex flex-col justify-end mb-1">
                <p className="text-xs uppercase font-semibold">USD</p>
                <p className="text-xs">/month</p>
              </div>
            </>
          ) : (
            <p className="text-5xl tracking-tight font-extrabold">{price}</p>
          )}
        </MotionDiv>
        <MotionDiv
          variants={listVariant}
          className="space-y-2.5 leading-relaxed text-base flex-1"
        >
          <ul>
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <CheckIcon size={18} className="text-rose-500 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </MotionDiv>
        <MotionDiv
          variants={listVariant}
          className="space-y-2 flex justify-center w-full"
        >
          {isStripePlan ? (
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className={cn(
                "w-full rounded-full flex items-center justify-center gap-2 bg-linear-to-r text-white border-2 py-3 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
                isMostPopular
                  ? "from-rose-800 to-rose-500 hover:from-rose-500 hover:to-rose-800 border-rose-900"
                  : "from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 border-rose-100"
              )}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Get Started <ArrowRight size={18} />
                </>
              )}
            </button>
          ) : (
            <Link
              href={paymentLink || "/sign-up"}
              className={cn(
                "w-full rounded-full flex items-center justify-center gap-2 bg-linear-to-r text-white border-2 py-3 font-semibold transition-all duration-300",
                isMostPopular
                  ? "from-rose-800 to-rose-500 hover:from-rose-500 hover:to-rose-800 border-rose-900"
                  : "from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 border-rose-100"
              )}
            >
              Get Started <ArrowRight size={18} />
            </Link>
          )}
        </MotionDiv>
      </div>
    </MotionDiv>
  );
};

export default function PricingSection() {
  const plans: PriceType[] = [
    {
      name: "Basic",
      description: "For individuals & occasional users",
      price: 9,
      features: [
        "5 document generations/month",
        "Standard RAG model",
        "PDF export",
        "Email support",
      ],
      isMostPopular: false,
      priceId: "price_1Rarb4ImsQm3JXX3zEHehEYa",
      paymentLink: "https://buy.stripe.com/test_14AdR9eTHd0Vgq85a84ko00",
      isStripePlan: true,
    },
    {
      name: "Pro",
      description: "For professionals & small teams",
      price: 19,
      features: [
        "50 document generations/month",
        "Advanced RAG model",
        "PDF & .docx export",
        "Document history",
        "Priority support",
      ],
      isMostPopular: true,
      priceId: "price_1RarcxImsQm3JXX3vD9FhKol",
      paymentLink: "https://buy.stripe.com/test_9B69AT5j74up0ra0TS4ko01",
      isStripePlan: true,
    },
    {
      name: "Enterprise",
      description: "For large organizations & legal firms",
      price: "Custom",
      features: [
        "Unlimited generations",
        "Custom RAG model fine-tuning",
        "Team collaboration features",
        "SSO & advanced security",
        "24/7 dedicated support",
      ],
      isMostPopular: false,
      paymentLink: "/contact",
      isStripePlan: false,
    },
  ];

  return (
    <MotionSection
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className="relative overflow-hidden bg-gray-50"
      id="pricing"
    >
      <div className="py-12 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MotionDiv
          variants={itemsVariants}
          className="flex flex-col items-center justify-center w-full pb-12"
        >
          <h2 className="uppercase font-bold text-xl mb-4 text-rose-500">
            Pricing
          </h2>
          <h3 className="text-3xl lg:text-4xl font-bold text-center max-w-2xl">
            Choose the perfect plan for your needs
          </h3>
        </MotionDiv>
        <div className="relative flex justify-center flex-col lg:flex-row items-center lg:items-stretch gap-8">
          {plans.map((plan) => (
            <PricingCard key={plan.name} {...plan} />
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
