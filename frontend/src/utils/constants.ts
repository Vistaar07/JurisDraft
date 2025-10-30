import { Variants, TargetAndTransition } from "framer-motion";

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
