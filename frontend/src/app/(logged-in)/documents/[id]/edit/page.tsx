"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import BgGradient from "@/components/common/bg-gradient";
import { MotionDiv } from "@/components/common/motion-wrapper";
import { containerVariants, itemsVariants } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { MinimalTiptap } from "@/components/ui/shadcn-io/minimal-tiptap";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Save,
  ArrowLeft,
  FileDown,
  Sparkles,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import jsPDF from "jspdf";
import { Card } from "@/components/ui/card";
import { useEditor } from "@tiptap/react";

type StoredDoc = {
  id: string;
  success?: boolean;
  document_type: string;
  document_text: string;
  title?: string;
  status?: string;
  checklist_items_included: number;
  governing_acts: string[];
  metadata: Record<string, unknown>;
};

export default function EditDocumentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;

  const [doc, setDoc] = useState<StoredDoc | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  useEffect(() => {
    if (!id) return;

    const fetchDocument = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/documents/${id}`);

        if (response.status === 404) {
          throw new Error("Document not found.");
        }

        if (!response.ok) {
          throw new Error("Failed to fetch document");
        }

        const data = await response.json();
        setDoc(data);
        setTitle(data.title || "");

        // Set the content for the editor
        const documentText = data.document_text || "";
        setHtmlContent(documentText);
      } catch (e) {
        console.error("Failed to load document", e);
        setError(e instanceof Error ? e.message : "Failed to load document");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const handleSave = async () => {
    if (!doc || !editorRef.current) return;
    setSaving(true);
    try {
      const editorHtml = editorRef.current.getHTML();

      const response = await fetch(`/api/documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || doc.title,
          document_text: editorHtml,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update document");
      }

      const updatedDoc = await response.json();
      setDoc(updatedDoc);

      // Show success and redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (e) {
      console.error("Failed to save document", e);
      alert(e instanceof Error ? e.message : "Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this document? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      // On success, redirect to the dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete document"
      );
    }
  };

  const exportToPDF = async () => {
    if (!editorRef.current) return;
    setExporting(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      let yPosition = margin;

      // Add title
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      const title =
        doc?.document_type?.replace(/_/g, " ").toUpperCase() ||
        "LEGAL DOCUMENT";
      pdf.text(title, margin, yPosition);
      yPosition += 10;

      // Add a line separator
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Get plain text from editor
      const editorText = editorRef.current.getText();
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");

      // Split text into lines that fit the page width
      const lines = pdf.splitTextToSize(editorText, maxWidth);

      for (const line of lines) {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += 7;
      }

      // Save the PDF
      const fileName = `${doc?.document_type || "document"}_${id}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const exportToDocx = async () => {
    if (!editorRef.current) return;
    setExporting(true);

    try {
      const htmlContent = editorRef.current.getHTML();

      // Create a complete HTML document with styling
      const styledHtml = `
        <!DOCTYPE html>
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Calibri, Arial, sans-serif; line-height: 1.6; margin: 40px; }
            h1, h2, h3 { color: #333; margin-top: 20px; }
            p { margin: 10px 0; }
            ul, ol { margin: 10px 0; padding-left: 30px; }
            blockquote { border-left: 3px solid #ccc; margin: 10px 0; padding-left: 15px; color: #666; }
            code { background: #f4f4f4; padding: 2px 6px; }
          </style>
        </head>
        <body>
          <h1>${
            doc?.document_type?.replace(/_/g, " ").toUpperCase() ||
            "LEGAL DOCUMENT"
          }</h1>
          <hr/>
          ${htmlContent}
        </body>
        </html>
      `;

      // Create a Blob with proper MIME type for Word documents
      const blob = new Blob(["\ufeff", styledHtml], {
        type: "application/msword",
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc?.document_type || "document"}_${id}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export DOCX:", error);
      alert("Failed to export document. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const goBack = () => router.push("/generate");

  return (
    <section className="min-h-screen">
      <BgGradient className="from-rose-500 via-red-500 to-pink-500 opacity-20" />
      <MotionDiv
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-6xl px-6 py-12 sm:py-16 lg:px-8"
      >
        {/* Header Section */}
        <MotionDiv variants={itemsVariants} className="mb-8">
          <MotionDiv
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center gap-3 mb-4"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="hover:bg-rose-50 hover:scale-105 transition-transform duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </MotionDiv>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <MotionDiv
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex items-center gap-3 mb-2"
              >
                <MotionDiv
                  animate={{
                    rotate: [0, -10, 10, -10, 0],
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.5,
                    ease: "easeInOut",
                  }}
                >
                  <FileText className="h-8 w-8 text-rose-600" />
                </MotionDiv>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900">
                  Edit Document
                </h1>
              </MotionDiv>
              {doc && (
                <MotionDiv
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="flex flex-wrap items-center gap-2 text-sm text-gray-600"
                >
                  <Badge
                    variant="secondary"
                    className="bg-rose-100 text-rose-700 animate-in fade-in slide-in-from-left duration-500"
                  >
                    {doc.document_type?.replace(/_/g, " ").toUpperCase()}
                  </Badge>
                  <span className="text-gray-400">•</span>
                  <MotionDiv
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    {doc.checklist_items_included} checklist items
                  </MotionDiv>
                  {doc.governing_acts && doc.governing_acts.length > 0 && (
                    <>
                      <span className="text-gray-400">•</span>
                      <MotionDiv
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.7,
                          type: "spring",
                          stiffness: 200,
                        }}
                        className="flex items-center gap-1"
                      >
                        <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
                        {doc.governing_acts.length} governing acts
                      </MotionDiv>
                    </>
                  )}
                </MotionDiv>
              )}
            </div>
          </div>
        </MotionDiv>

        {/* Editor Section */}
        <MotionDiv
          variants={itemsVariants}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="p-6 bg-white shadow-lg border-gray-200 hover:shadow-xl transition-shadow duration-300">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-rose-600 border-r-transparent mb-4"></div>
                <p className="text-gray-500 text-lg">Loading document...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-red-300 mx-auto mb-4" />
                <p className="text-red-500 text-lg font-semibold">{error}</p>
                <p className="text-gray-400 text-sm mt-2">
                  Please try again or generate a new document.
                </p>
                <div className="flex gap-3 justify-center mt-4">
                  <Button onClick={goBack} variant="outline">
                    Go to Generate
                  </Button>
                  <Button
                    onClick={() => router.push("/dashboard")}
                    variant="default"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            ) : doc ? (
              <div className="space-y-6">
                <MotionDiv
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <MinimalTiptap
                    content={htmlContent}
                    onChange={(html) => setHtmlContent(html)}
                    placeholder="Start editing your legal document..."
                    className="min-h-[60vh] bg-white"
                    onEditorReady={(editor) => {
                      editorRef.current = editor;
                    }}
                  />
                </MotionDiv>

                {/* Action Buttons */}
                <MotionDiv
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 }}
                  className="flex flex-wrap items-center gap-3 pt-4 border-t"
                >
                  <MotionDiv
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={handleSave}
                      disabled={!doc || saving}
                      className="bg-linear-to-r from-slate-900 to-rose-900 hover:from-rose-600 hover:to-slate-900 text-white transition-all duration-300"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save Document"}
                    </Button>
                  </MotionDiv>

                  <MotionDiv
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={exportToPDF}
                      disabled={!doc || exporting}
                      variant="outline"
                      className="border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-all duration-300"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export to PDF
                    </Button>
                  </MotionDiv>

                  <MotionDiv
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={exportToDocx}
                      disabled={!doc || exporting}
                      variant="outline"
                      className="border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Export to DOCX
                    </Button>
                  </MotionDiv>

                  <div className="flex-1" />

                  <MotionDiv
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={handleDelete}
                      disabled={!doc}
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Document
                    </Button>
                  </MotionDiv>

                  {exporting && (
                    <MotionDiv
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm text-gray-500 ml-2 flex items-center gap-2"
                    >
                      <span className="inline-block w-2 h-2 bg-rose-600 rounded-full animate-ping" />
                      Exporting...
                    </MotionDiv>
                  )}
                </MotionDiv>

                {/* Document Info */}
                {doc.governing_acts && doc.governing_acts.length > 0 && (
                  <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    className="pt-4 border-t"
                  >
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Governing Acts Referenced:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {doc.governing_acts.map((act, idx) => (
                        <MotionDiv
                          key={idx}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            delay: 1.1 + idx * 0.1,
                            type: "spring",
                            stiffness: 200,
                          }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <Badge
                            variant="outline"
                            className="text-xs border-rose-200 text-rose-700 cursor-default"
                          >
                            {act}
                          </Badge>
                        </MotionDiv>
                      ))}
                    </div>
                  </MotionDiv>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Document not found in browser storage.
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Please generate a new document from the Generate page.
                </p>
                <Button onClick={goBack} variant="outline" className="mt-4">
                  Go to Generate
                </Button>
              </div>
            )}
          </Card>
        </MotionDiv>
      </MotionDiv>
    </section>
  );
}
