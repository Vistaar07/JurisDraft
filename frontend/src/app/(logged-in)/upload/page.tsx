"use client";

import BgGradient from "@/components/common/bg-gradient";
import { MotionDiv } from "@/components/common/motion-wrapper";
import UploadHeader from "@/components/upload/upload-header";
import ComplianceForm from "@/components/upload/compliance-form";
import { containerVariants } from "@/utils/constants";

export default function UploadPage() {
  return (
    <section className="min-h-screen">
      <BgGradient />
      <MotionDiv
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8"
      >
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <UploadHeader />
          <ComplianceForm />
        </div>
      </MotionDiv>
    </section>
  );
}
