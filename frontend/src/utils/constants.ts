import { Variants, TargetAndTransition } from "framer-motion";
import { isDev } from "./helpers";

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

export const itemsVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  },
};

export const buttonVariants: TargetAndTransition = {
  scale: 1.05,
  transition: {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
};

export const pricingPlans = [
  {
    name: "Basic",
    price: 9,
    description: "Perfect for occasional users",
    items: [
      "5 Summaries per month",
      "Standard processing speed",
      "Email support",
    ],
    id: "basic",
    paymentLink: isDev
      ? "https://buy.stripe.com/test_14AdR9eTHd0Vgq85a84ko00"
      : "https://buy.stripe.com/test_14AdR9eTHd0Vgq85a84ko00",
    priceId: isDev
      ? "price_1Rarb4ImsQm3JXX3zEHehEYa"
      : "price_1Rarb4ImsQm3JXX3zEHehEYa",
  },
  {
    name: "Pro",
    price: 19,
    description: "For professionals and teams",
    items: [
      "Unlimited PDF summaries",
      "Priority processing",
      "24/7 priority support",
      "Markdown export",
    ],
    id: "pro",
    paymentLink: isDev
      ? "https://buy.stripe.com/test_9B69AT5j74up0ra0TS4ko01"
      : "https://buy.stripe.com/test_9B69AT5j74up0ra0TS4ko01",
    priceId: isDev
      ? "price_1RarcxImsQm3JXX3vD9FhKol"
      : "price_1RarcxImsQm3JXX3vD9FhKol",
  },
];
