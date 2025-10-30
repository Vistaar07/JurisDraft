import { PDFParse } from "pdf-parse";

export async function fetchAndExtractPdfText(fileUrl: string) {
  const response = await fetch(fileUrl);
  const arrayBuffer = await response.arrayBuffer();

  // Convert ArrayBuffer to Uint8Array (pdf-parse requires Uint8Array, not Buffer)
  const uint8Array = new Uint8Array(arrayBuffer);

  // Parse the PDF using pdf-parse
  const parser = new PDFParse(uint8Array);
  const result = await parser.getText();

  return result.text;
}
