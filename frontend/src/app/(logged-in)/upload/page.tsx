"use client";

import BgGradient from "@/components/common/bg-gradient";
import { MotionDiv } from "@/components/common/motion-wrapper";
import UploadForm from "@/components/upload/upload-form";
import UploadHeader from "@/components/upload/upload-header";
import ComplianceForm from "@/components/upload/compliance-form";
import { containerVariants, itemsVariants } from "@/utils/constants";
import { useState } from "react";
import { FileText, PenSquare } from "lucide-react";

export default function UploadPage() {
  const [mode, setMode] = useState<"document" | "compliance">("document");

  return (
    <section className="min-h-screen">
      <BgGradient />
      <MotionDiv
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8"
      >
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <UploadHeader />

          {/* Mode Toggle */}
          <MotionDiv
            variants={itemsVariants}
            className="flex gap-2 items-center"
          >
            <button
              onClick={() => setMode("document")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                mode === "document"
                  ? "bg-rose-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <FileText className="h-5 w-5" />
              Document Generation
            </button>
            <button
              onClick={() => setMode("compliance")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                mode === "compliance"
                  ? "bg-rose-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <PenSquare className="h-5 w-5" />
              Compliance Check
            </button>
          </MotionDiv>

          {mode === "document" ? <UploadForm /> : <ComplianceForm />}
        </div>
      </MotionDiv>
    </section>
  );
}
