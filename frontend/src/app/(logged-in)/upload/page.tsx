"use client";

import BgGradient from "@/components/common/bg-gradient";
import { MotionDiv } from "@/components/common/motion-wrapper";
import UploadHeader from "@/components/upload/upload-header";
import ComplianceForm from "@/components/upload/compliance-form";
import ProtectedFeature from "@/components/common/protected-feature";
import { containerVariants } from "@/utils/constants";
import { ShieldCheck } from "lucide-react";

export default function UploadPage() {
  return (
    <ProtectedFeature
      featureName="Compliance Analysis"
      featureDescription="You need an active plan to access the Compliance Analysis feature of JurisDraft. Upload and analyze your legal documents for compliance issues, loopholes, and potential risks. Get detailed reports with risk assessments and recommendations."
      icon={<ShieldCheck className="w-16 h-16" />}
    >
      <UploadContent />
    </ProtectedFeature>
  );
}

function UploadContent() {
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
