"use client";

import { cn } from "@/lib/utils";
import { containerVariants, itemsVariants } from "@/utils/constants";
import { ArrowRight, CheckIcon } from "lucide-react";
import Link from "next/link";
import { MotionDiv, MotionSection } from "../common/motion-wrapper";

type PriceType = {
  name: string;
  price: string | number;
  description: string;
  features: string[];
  isMostPopular: boolean;
  paymentLink: string;
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
}: PriceType) => {
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
          <Link
            href={paymentLink}
            className={cn(
              "w-full rounded-full flex items-center justify-center gap-2 bg-linear-to-r text-white border-2 py-3 font-semibold transition-all duration-300",
              isMostPopular
                ? "from-rose-800 to-rose-500 hover:from-rose-500 hover:to-rose-800 border-rose-900"
                : "from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 border-rose-100"
            )}
          >
            Get Started <ArrowRight size={18} />
          </Link>
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
      paymentLink: "/sign-up",
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
      paymentLink: "/sign-up",
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
