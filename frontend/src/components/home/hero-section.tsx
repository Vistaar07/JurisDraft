"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Scale, FileText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import AnimatedContent from "@/components/bits/AnimatedContent";
import BgGradient from "@/components/common/bg-gradient";
import {
  MotionDiv,
  MotionH1,
  MotionH2,
  MotionSection,
  MotionSpan,
} from "@/components/common/motion-wrapper";
import {
  buttonVariants,
  containerVariants,
  itemsVariants,
} from "@/utils/constants";

export default function HeroSection() {
  return (
    <MotionSection
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative mx-auto flex flex-col z-0
    items-center justify-center py-16 sm:py-20 lg:min-h-screen lg:py-0 transition-all
    animate-in lg:px-12 max-w-7xl"
    >
      {/* Background Gradient */}
      <BgGradient className="from-rose-500 via-red-500 to-pink-500 opacity-20" />

      {/* Badge */}
      <MotionDiv
        variants={itemsVariants}
        className="relative p-[3px] overflow-hidden mb-6 lg:mb-8
        rounded-full bg-linear-to-r from-rose-200 via-rose-500 
        to-rose-800 animate-gradient-x group"
      >
        <Badge
          variant={"secondary"}
          className="relative px-6 py-2 text-base 
          font-medium bg-white rounded-full group-hover:bg-gray-50 
          transition-colors duration-200"
        >
          <Sparkles className="size-6 text-rose-600 animate-pulse" />
          <p className="text-base text-rose-600 font-semibold">
            AI-Powered Legal Solutions
          </p>
        </Badge>
      </MotionDiv>

      {/* Main Heading */}
      <MotionH1
        variants={itemsVariants}
        className="font-bold mb-6 sm:mb-8 lg:mb-6 text-center text-4xl sm:text-5xl lg:text-6xl 
        text-gray-900 px-4 leading-tight"
      >
        Draft Legal Documents with{" "}
        <span className="relative inline-block">
          <MotionSpan
            whileHover={buttonVariants}
            className="relative z-10 px-2"
          >
            Intelligence
          </MotionSpan>
          <span
            className="absolute inset-0 bg-rose-200/50 -rotate-2
          rounded-lg transform -skew-y-1"
            aria-hidden="true"
          ></span>
        </span>
      </MotionH1>

      {/* Subheading */}
      <MotionH2
        variants={itemsVariants}
        className="text-lg sm:text-xl lg:text-xl 
      text-center px-6 lg:px-0 lg:max-w-3xl text-gray-600 mb-8 sm:mb-10 lg:mb-8 leading-relaxed"
      >
        Generate professional legal documents in minutes with AI-powered
        precision. From contracts to compliance checklists, JurisDraft handles
        the complexity.
      </MotionH2>

      {/* Feature Pills */}
      <MotionDiv
        variants={itemsVariants}
        className="flex flex-wrap items-center justify-center gap-4 sm:gap-5 lg:gap-6 mb-10 sm:mb-12 lg:mb-8 px-4"
      >
        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-rose-50 border border-rose-200">
          <Scale className="h-5 w-5 text-rose-600" />
          <span className="text-sm sm:text-base font-medium text-rose-700">
            Legal Expertise
          </span>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-red-50 border border-red-200">
          <FileText className="h-5 w-5 text-red-600" />
          <span className="text-sm sm:text-base font-medium text-red-700">
            Smart Templates
          </span>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-pink-50 border border-pink-200">
          <Sparkles className="h-5 w-5 text-pink-600" />
          <span className="text-sm sm:text-base font-medium text-pink-700">
            AI-Powered
          </span>
        </div>
      </MotionDiv>

      {/* CTA Button */}
      <MotionDiv
        variants={itemsVariants}
        whileHover={buttonVariants}
        className="mb-10 sm:mb-12 lg:mb-6"
      >
        <AnimatedContent
          distance={25}
          direction="vertical"
          reverse={false}
          duration={1}
          ease="bounce.out"
          initialOpacity={0}
          animateOpacity
          scale={1.1}
          threshold={0.1}
          delay={0.3}
        >
          <Button
            variant={"link"}
            className="text-white text-base
        sm:text-lg lg:text-xl rounded-full px-10 sm:px-12 lg:px-16 py-7 sm:py-8 lg:py-9
        bg-linear-to-r from-slate-900 to-rose-900 hover:from-rose-500 
        hover:to-slate-900 font-bold hover:no-underline shadow-lg 
        hover:shadow-xl transition-all duration-300 group"
          >
            <Link href="/generate" className="flex gap-3 items-center">
              <span>Start Drafting Now</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </Button>
        </AnimatedContent>
      </MotionDiv>

      {/* Trust Indicators */}
      <MotionDiv
        variants={itemsVariants}
        className="text-center text-sm sm:text-base text-gray-500"
      >
        <p>Trusted by legal professionals worldwide</p>
      </MotionDiv>
    </MotionSection>
  );
}
