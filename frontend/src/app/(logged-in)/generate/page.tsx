"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BgGradient from "@/components/common/bg-gradient";
import { MotionDiv } from "@/components/common/motion-wrapper";
import ProtectedFeature from "@/components/common/protected-feature";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
  PromptInputTools,
} from "@/components/ui/shadcn-io/ai/prompt-input";
import { containerVariants, itemsVariants } from "@/utils/constants";
import { Badge } from "@/components/ui/badge";
import { Sparkles, SquareArrowUpRight, Loader2 } from "lucide-react";

interface GenerateResponseMeta {
  success: boolean;
  document_type: string;
  document_text: string;
  checklist_items_included: number;
  governing_acts: string[];
  metadata: Record<string, unknown>;
}

// Simple heuristic parser: user prompt -> structured inputs.
// In future this can be replaced by an LLM parsing endpoint.
function promptToStructuredJSON(prompt: string) {
  // Basic defaults; user may override by including keywords in prompt.
  const lower = prompt.toLowerCase();

  // Detect document type keywords; fallback to nda.
  const typeMap: Record<string, string> = {
    nda: "nda",
    "offer letter": "offer_letter",
    "non-compete": "non_compete_agreement",
    "partnership deed": "partnership_deed",
    mou: "mou",
    "shareholder agreement": "shareholder_agreement",
    "vendor agreement": "vendor_agreement",
    "terms and conditions": "terms_and_conditions",
    loan: "loan_repayment_agreement",
    "sale deed": "sale_deed",
    "legal notice": "legal_notice",
    indemnity: "indemnity_bond",
    "cease and desist": "cease_and_desist",
  };

  let document_type = "nda";
  for (const key of Object.keys(typeMap)) {
    if (lower.includes(key)) {
      document_type = typeMap[key];
      break;
    }
  }

  // Extract simple fields using regex (very naive; can be replaced later)
  const partyA =
    /party\s*a[:\-]?\s*(.+)/i.exec(prompt)?.[1]?.split(/[,\n]/)[0] ||
    "TechCorp India Pvt. Ltd.";
  const partyB =
    /party\s*b[:\-]?\s*(.+)/i.exec(prompt)?.[1]?.split(/[,\n]/)[0] ||
    "John Doe";
  const term =
    /term[:\-]?\s*(\d+\s*year|\d+\s*years|\d+\s*month|\d+\s*months|\d+\s*days?)/i.exec(
      prompt
    )?.[1] || "3 years";
  const purpose =
    /purpose[:\-]?\s*(.+)/i.exec(prompt)?.[1]?.split(/\n/)[0] ||
    "Evaluating potential business partnership";
  const effectiveDate = new Date().toISOString().split("T")[0];

  return {
    document_type,
    user_inputs: {
      party_a: partyA.trim(),
      party_a_address: "123 Tech Park, Bangalore",
      party_b: partyB.trim(),
      party_b_address: "456 Residency Road, Bangalore",
      purpose: purpose.trim(),
      term: term.trim(),
      effective_date: effectiveDate,
    },
    jurisdiction: "India",
    output_format: "markdown",
    include_sources: true,
  };
}

export default function GeneratePage() {
  return (
    <ProtectedFeature
      featureName="Document Generation"
      featureDescription="You need an active plan to access the Document Generation feature of JurisDraft. Create AI-powered legal documents tailored to Indian law. Simply describe your requirements and get professionally drafted documents including NDAs, contracts, agreements, and more."
      icon={<Sparkles className="w-16 h-16" />}
    >
      <GenerateContent />
    </ProtectedFeature>
  );
}

function GenerateContent() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitted" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const prompt = String(formData.get("message") || "").trim();
    if (!prompt) {
      setError("Please enter a prompt describing the document you want.");
      return;
    }
    setStatus("submitted");
    setIsLoading(true);
    try {
      const payload = promptToStructuredJSON(prompt);
      console.log("[Generate] Request payload:", payload);

      // Step 1: Generate document from backend
      const res = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Backend error (${res.status}): ${text}`);
      }
      const data: GenerateResponseMeta = await res.json();
      console.log("[Generate] Response:", data);

      // Step 2: Save document to database via API
      const saveResponse = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_type: data.document_type,
          document_text: data.document_text,
          title: `${data.document_type
            .replace(/_/g, " ")
            .toUpperCase()} - ${new Date().toLocaleDateString()}`,
          status: "draft",
          checklist_items_included: data.checklist_items_included,
          governing_acts: data.governing_acts,
          metadata: data.metadata,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to save document");
      }

      const newDocument = await saveResponse.json();
      console.log("[Generate] Document saved:", newDocument);

      // Redirect to the edit page with the new document ID
      router.push(`/documents/${newDocument.id}/edit`);
    } catch (e: unknown) {
      console.error(e);
      const msg =
        e instanceof Error ? e.message : "Unexpected error generating document";
      setError(msg);
      setStatus("error");
    } finally {
      setIsLoading(false);
      setStatus("idle");
    }
  }

  return (
    <section className="min-h-screen">
      <BgGradient />
      <MotionDiv
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-8"
      >
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <MotionDiv
            variants={itemsVariants}
            className="relative p-[3px] overflow-hidden rounded-full bg-linear-to-r from-rose-200 via-rose-500 to-rose-800 animate-gradient-x group"
          >
            <Badge
              variant={"secondary"}
              className="relative px-6 py-2 text-base font-medium bg-white rounded-full group-hover:bg-gray-50 transition-colors"
            >
              <Sparkles className="h-6 w-6 mr-2 text-rose-600 animate-pulse" />
              <p className="text-base">AI-Powered Document Generation</p>
            </Badge>
          </MotionDiv>
          <MotionDiv
            variants={itemsVariants}
            className="capitalize text-4xl font-bold tracking-light text-gray-900 sm:text-5xl"
          >
            Prompt your way to{" "}
            <span className="relative inline-block">
              <span className="relative z-10 px-2">a legal document</span>
              <span
                className="absolute inset-0 bg-rose-200/50 -rotate-2
          rounded-lg transform -skey-y-1"
                aria-hidden="true"
              ></span>
            </span>{" "}
          </MotionDiv>
          <MotionDiv
            variants={itemsVariants}
            className="mt-2 text-lg leading-8 text-gray-600 max-w-2xl text-center"
          >
            <p>
              Describe the parties, purpose, term, and type of document you
              want. We&apos;ll structure it and generate a compliant draft. ✨
            </p>
          </MotionDiv>

          <PromptInput
            className="bg-card border-muted/40 w-full max-w-3xl mt-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await handleSubmit(formData);
            }}
          >
            <PromptInputTextarea placeholder="e.g. Create an NDA between TechCorp India Pvt. Ltd. (Party A) and John Doe (Party B) for evaluating a potential partnership. Term 3 years." />
            <PromptInputToolbar>
              <PromptInputTools>
                <span className="text-xs text-muted-foreground font-medium px-2">
                  RAG Model + Gemini 2.5 Pro
                </span>
              </PromptInputTools>
              <div className="flex items-center gap-2">
                {error && (
                  <span className="text-sm text-red-500" role="alert">
                    {error}
                  </span>
                )}
                <PromptInputSubmit
                  status={
                    status === "submitted"
                      ? "submitted"
                      : status === "error"
                      ? "error"
                      : undefined
                  }
                  variant="default"
                  disabled={status === "submitted" || isLoading}
                >
                  {status === "submitted" || isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <SquareArrowUpRight className="h-4 w-4" />
                  )}
                </PromptInputSubmit>
              </div>
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </MotionDiv>
    </section>
  );
}
