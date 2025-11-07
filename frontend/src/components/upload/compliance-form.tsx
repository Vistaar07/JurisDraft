"use client";

import { FormEvent, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { FileText, Upload, Loader2 } from "lucide-react";
import { useUploadThing } from "@/utils/uploadthing";
import { generatePdfText } from "@/actions/upload-actions";

const documentTypes = [
  { value: "offer_letter", label: "Offer Letter" },
  { value: "nda", label: "Non-Disclosure Agreement (NDA)" },
  { value: "non_compete_agreement", label: "Non-Compete Agreement" },
  { value: "partnership_deed", label: "Partnership Deed" },
  { value: "mou", label: "Memorandum of Understanding (MoU)" },
  { value: "shareholder_agreement", label: "Shareholder Agreement" },
  { value: "vendor_agreement", label: "Vendor Agreement" },
  { value: "terms_and_conditions", label: "Terms & Conditions" },
  { value: "loan_repayment_agreement", label: "Loan Repayment Agreement" },
  { value: "sale_deed", label: "Sale Deed" },
  { value: "legal_notice", label: "Legal Notice" },
  { value: "indemnity_bond", label: "Indemnity Bond" },
  { value: "cease_and_desist", label: "Cease and Desist Notice" },
];

const fileSchema = z.object({
  file: z
    .instanceof(File, { message: "Invalid file" })
    .refine(
      (file) => file.size <= 20 * 1024 * 1024,
      "File size must be less than 20MB"
    )
    .refine(
      (file) =>
        file.type.startsWith("application/pdf") ||
        file.type.startsWith("application/vnd.openxmlformats") ||
        file.type === "text/plain",
      "File must be PDF, DOCX, or TXT"
    ),
});

const textSchema = z.object({
  text: z.string().min(50, "Document text must be at least 50 characters"),
  documentType: z.string().min(1, "Please select a document type"),
});

export default function ComplianceForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "file">("text");
  const [documentText, setDocumentText] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { startUpload } = useUploadThing("pdfUploader", {
    onClientUploadComplete: () => {
      console.log("✅ Upload complete");
    },
    onUploadError: (error) => {
      console.error("❌ Upload error:", error);
      toast("Error occurred while uploading", {
        description: error.message,
        duration: 3000,
        icon: "❌",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let textToAnalyze = "";

      if (inputMode === "text") {
        // Validate text input
        const validatedFields = textSchema.safeParse({
          text: documentText,
          documentType,
        });

        if (!validatedFields.success) {
          toast("Validation Error", {
            description: validatedFields.error.issues[0].message,
            duration: 3000,
            icon: "❌",
          });
          setIsLoading(false);
          return;
        }

        textToAnalyze = documentText;
      } else {
        // Handle file upload
        if (!selectedFile) {
          toast("No file selected", {
            description: "Please select a file to upload",
            duration: 3000,
            icon: "❌",
          });
          setIsLoading(false);
          return;
        }

        if (!documentType) {
          toast("Document type required", {
            description: "Please select a document type",
            duration: 3000,
            icon: "❌",
          });
          setIsLoading(false);
          return;
        }

        // Validate file
        const validatedFile = fileSchema.safeParse({ file: selectedFile });
        if (!validatedFile.success) {
          toast("Validation Error", {
            description: validatedFile.error.issues[0].message,
            duration: 3000,
            icon: "❌",
          });
          setIsLoading(false);
          return;
        }

        toast("Uploading file...", {
          description: "Please wait while we process your document...",
          duration: 3000,
          icon: "📤",
        });

        // Upload file if PDF
        if (selectedFile.type === "application/pdf") {
          const uploadResponse = await startUpload([selectedFile]);

          if (!uploadResponse || uploadResponse.length === 0) {
            toast("Upload Failed", {
              description: "Failed to upload the file. Please try again.",
              duration: 3000,
              icon: "❌",
            });
            setIsLoading(false);
            return;
          }

          const uploadFileUrl = uploadResponse[0].serverData.fileUrl;

          // Extract text from PDF
          const result = await generatePdfText({ fileUrl: uploadFileUrl });

          if (result.success && result.data?.pdfText) {
            textToAnalyze = result.data.pdfText;
          } else {
            toast("Processing Failed", {
              description: result.message || "Failed to extract text from PDF",
              duration: 3000,
              icon: "❌",
            });
            setIsLoading(false);
            return;
          }
        } else {
          // For DOCX or TXT, read as text
          textToAnalyze = await selectedFile.text();
        }
      }

      // Send to compliance API
      toast("Analyzing document...", {
        description: "Running compliance checks...",
        duration: 3000,
        icon: "🔍",
      });

      const formData = new FormData();
      formData.append("document_text", textToAnalyze);
      formData.append("document_type", documentType);
      formData.append("jurisdiction", "India");

      const response = await fetch(
        "http://localhost:8001/check-compliance/text",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Compliance check failed");
      }

      const result = await response.json();

      // Save compliance report to database via API
      const saveResponse = await fetch("/api/compliance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Send the entire JSON report we got from the Python backend
        body: JSON.stringify(result),
      });

      if (!saveResponse.ok) {
        // If saving to our DB fails, we should notify the user
        throw new Error(
          "Failed to save the compliance report to your dashboard."
        );
      }

      const newReport = await saveResponse.json(); // This will return { id: '...' }

      toast("Analysis Complete!", {
        description: "Redirecting to results...",
        icon: "✅",
        duration: 2000,
      });

      // Redirect to the new analysis page with the database ID
      setTimeout(() => {
        router.push(`/compliance/${newReport.id}/analysis`);
      }, 1000);
    } catch (error) {
      console.error("❌ Error:", error);
      toast("Error", {
        description: "Failed to analyze document. Please try again.",
        duration: 3000,
        icon: "❌",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-white shadow-lg">
      <CardHeader className="border-b pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-5 w-5 text-rose-600" />
          Analyze Your Document
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Upload a document or paste text to check for compliance issues
        </p>
      </CardHeader>
      <CardContent className="pt-4 pb-4">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Input Mode Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInputMode("text")}
              className={`flex-1 py-2 rounded-lg font-medium transition-all text-sm ${
                inputMode === "text"
                  ? "bg-rose-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Paste Text
            </button>
            <button
              type="button"
              onClick={() => setInputMode("file")}
              className={`flex-1 py-2 rounded-lg font-medium transition-all text-sm ${
                inputMode === "file"
                  ? "bg-rose-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Upload File
            </button>
          </div>

          {/* Document Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Document Type *
            </label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Text Input or File Upload */}
          {inputMode === "text" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Document Text *
              </label>
              <Textarea
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                placeholder="Paste your legal document text here..."
                className="min-h-[200px] resize-y"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Minimum 50 characters required
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Upload Document *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-rose-400 transition-colors">
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <Input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="max-w-xs mx-auto"
                />
                {selectedFile && (
                  <p className="mt-3 text-sm text-gray-600">
                    Selected: {selectedFile.name}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Accepted formats: PDF, DOCX, TXT (Max 20MB)
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white py-5 text-base font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 mr-2" />
                Check Compliance
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
