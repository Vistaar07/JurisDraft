"use client";

import { FormEvent, useRef, useState } from "react";
import UploadFormInput from "./upload-form-input";
import { z } from "zod";
import { useUploadThing } from "@/utils/uploadthing";
import { toast } from "sonner";
import { generatePdfText } from "@/actions/upload-actions";
// import LoadingSkeleton from "./loading-skeleton";

const schema = z.object({
  file: z
    .instanceof(File, { message: "Invalid file" })
    .refine(
      (file) => file.size <= 20 * 1024 * 1024,
      "File size must be less than 20MB"
    )
    .refine(
      (file) => file.type.startsWith("application/pdf"),
      "File must be a PDF"
    ),
});

export default function UploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    onUploadBegin: (file) => {
      console.log("📤 Upload started for file:", file);
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const formData = new FormData(e.currentTarget);
      const file = formData.get("file") as File;

      // Validate the file
      const validatedFields = schema.safeParse({ file });
      if (!validatedFields.success) {
        toast("Validation Error", {
          description: validatedFields.error.issues[0].message,
          duration: 3000,
          icon: "❌",
        });
        setIsLoading(false);
        return;
      }

      // Upload the file to UploadThing
      toast("Uploading PDF...", {
        description: "Please wait while we upload your PDF...",
        duration: 3000,
        icon: "📤",
      });

      const uploadResponse = await startUpload([file]);

      if (!uploadResponse || uploadResponse.length === 0) {
        toast("Upload Failed", {
          description: "Failed to upload the PDF. Please try again.",
          duration: 3000,
          icon: "❌",
        });
        setIsLoading(false);
        return;
      }

      const uploadFileUrl = uploadResponse[0].serverData.fileUrl;
      console.log("📄 Uploaded File URL:", uploadFileUrl);

      // Parse the PDF using LangChain
      toast("Processing PDF...", {
        description: "Extracting text from your PDF...",
        duration: 3000,
        icon: "📄",
      });

      const result = await generatePdfText({
        fileUrl: uploadFileUrl,
      });

      if (result.success && result.data?.pdfText) {
        console.log("\n=== PDF TEXT EXTRACTED ===\n");
        console.log(result.data.pdfText);
        console.log("\n=== END OF PDF TEXT ===\n");

        toast("Success!", {
          description: "PDF text has been extracted and logged to console!",
          icon: "✅",
          duration: 3000,
        });
      } else {
        toast("Processing Failed", {
          description: result.message || "Failed to extract text from PDF",
          duration: 3000,
          icon: "❌",
        });
      }

      formRef.current?.reset();
    } catch (error) {
      console.error("❌ Error occurred:", error);
      toast("Error", {
        description: "An unexpected error occurred. Please try again.",
        duration: 3000,
        icon: "❌",
      });
      formRef.current?.reset();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200 dark:border-gray-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-muted-foreground text-sm">
            Upload PDF
          </span>
        </div>
      </div>
      <UploadFormInput
        isLoading={isLoading}
        ref={formRef}
        onSubmit={handleSubmit}
      />
      {/* {isLoading && (
        <>
          <div className="relative">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-muted-foreground text-sm">
                Processing
              </span>
            </div>
          </div>
          <LoadingSkeleton />
        </>
      )} */}
    </div>
  );
}
