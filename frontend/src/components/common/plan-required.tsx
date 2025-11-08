"use client";

import { ArrowRight, Lock, Sparkles } from "lucide-react";
import BgGradient from "./bg-gradient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { MotionDiv } from "./motion-wrapper";

type PlanRequiredProps = {
  featureName: string;
  featureDescription: string;
  icon?: React.ReactNode;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 12,
    },
  },
};

const floatingAnimation = {
  y: [-10, 10, -10],
  transition: {
    duration: 3,
    repeat: Infinity as number,
    ease: "easeInOut" as const,
  },
};

export default function PlanRequired({
  featureName,
  featureDescription,
  icon,
}: PlanRequiredProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <BgGradient className="from-rose-400 via-rose-300 to-orange-200" />

      <MotionDiv
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container px-4 sm:px-6 lg:px-8 py-16 relative z-10"
      >
        <div className="flex flex-col items-center justify-center gap-8 text-center max-w-3xl mx-auto">
          {/* Floating Lock Icon */}
          <MotionDiv animate={floatingAnimation} className="relative">
            <div className="relative">
              {/* Pulsing Background Circle */}
              <MotionDiv
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.1, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity as number,
                  ease: "easeInOut" as const,
                }}
                className="absolute inset-0 bg-rose-500 rounded-full blur-xl"
              />

              {/* Lock Icon */}
              <MotionDiv
                variants={itemVariants}
                className="relative bg-linear-to-br from-rose-500 to-rose-700 text-white p-6 rounded-full shadow-2xl"
              >
                <Lock className="w-12 h-12" />
              </MotionDiv>
            </div>
          </MotionDiv>

          {/* Premium Feature Badge */}
          <MotionDiv
            variants={itemVariants}
            className="flex items-center gap-2 text-rose-600 bg-rose-100 px-4 py-2 rounded-full border border-rose-200"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Premium Feature
            </span>
          </MotionDiv>

          {/* Main Heading */}
          <MotionDiv variants={itemVariants} className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="bg-linear-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
                Unlock {featureName}
              </span>
            </h1>
          </MotionDiv>

          {/* Feature Card */}
          <MotionDiv variants={itemVariants} className="w-full">
            <Card className="border-2 border-rose-200 bg-white/80 backdrop-blur-sm shadow-xl p-8 rounded-2xl">
              <div className="flex flex-col items-center gap-4">
                {icon && <div className="text-rose-600 mb-2">{icon}</div>}
                <p className="text-lg leading-relaxed text-gray-700">
                  {featureDescription}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                  <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                  <span>Available in Basic and Pro plans</span>
                </div>
              </div>
            </Card>
          </MotionDiv>

          {/* Call to Action */}
          <MotionDiv
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Button
              asChild
              size="lg"
              className="bg-linear-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <Link href="/#pricing" className="flex gap-2 items-center">
                View Pricing Plans
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-rose-600 text-rose-600 hover:bg-rose-50"
            >
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </MotionDiv>

          {/* Benefits Preview */}
          <MotionDiv
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-8"
          >
            <div className="flex items-start gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-rose-100">
              <div className="shrink-0 w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                <span className="text-rose-600 font-bold text-sm">1</span>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Choose Your Plan
                </h4>
                <p className="text-sm text-gray-600">
                  Select Basic or Pro based on your needs
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-rose-100">
              <div className="shrink-0 w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                <span className="text-rose-600 font-bold text-sm">2</span>
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Instant Access
                </h4>
                <p className="text-sm text-gray-600">
                  Get immediate access to all premium features
                </p>
              </div>
            </div>
          </MotionDiv>
        </div>
      </MotionDiv>
    </div>
  );
}
