"use server";

import { fetchAndExtractPdfText } from "@/lib/langchain";

export async function generatePdfText({ fileUrl }: { fileUrl: string }) {
  if (!fileUrl) {
    return {
      success: false,
      message: "Failed to fetch and extract PDF text",
      data: null,
    };
  }

  try {
    const pdfText = await fetchAndExtractPdfText(fileUrl);

    if (!pdfText) {
      return {
        success: false,
        message: "Failed to fetch and extract text from PDF",
        data: null,
      };
    }

    return {
      success: true,
      message: "PDF text generated successfully",
      data: {
        pdfText,
      },
    };
  } catch (err) {
    console.error("Error extracting PDF text:", err);
    return {
      success: false,
      message: "Failed to fetch and extract PDF text",
      data: null,
    };
  }
}
