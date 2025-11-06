"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BgGradient from "@/components/common/bg-gradient";
import { MotionDiv } from "@/components/common/motion-wrapper";
import { containerVariants, itemsVariants } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit, Trash2, FolderOpen, Plus } from "lucide-react";
import Link from "next/link";

type StoredDoc = {
  id: string;
  success: boolean;
  document_type: string;
  document_text: string;
  checklist_items_included: number;
  governing_acts: string[];
  metadata: Record<string, unknown>;
};

export default function DashboardPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<StoredDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedDocIds = JSON.parse(
        localStorage.getItem("jurisdraft_saved_documents") || "[]"
      );
      const docs: StoredDoc[] = [];

      for (const docId of savedDocIds) {
        const raw = localStorage.getItem(`jurisdraft_document_${docId}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            docs.push(parsed);
          } catch (e) {
            console.error(`Failed to parse document ${docId}`, e);
          }
        }
      }

      setDocuments(docs);
    } catch (e) {
      console.error("Failed to load documents", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      // Remove from localStorage
      localStorage.removeItem(`jurisdraft_document_${docId}`);

      // Update saved documents list
      const savedDocIds = JSON.parse(
        localStorage.getItem("jurisdraft_saved_documents") || "[]"
      );
      const updated = savedDocIds.filter((id: string) => id !== docId);
      localStorage.setItem(
        "jurisdraft_saved_documents",
        JSON.stringify(updated)
      );

      // Update state
      setDocuments(documents.filter((doc) => doc.id !== docId));
    } catch (e) {
      console.error("Failed to delete document", e);
      alert("Failed to delete document. Please try again.");
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    const plainText = text.replace(/<[^>]*>/g, "").replace(/\n/g, " ");
    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + "..."
      : plainText;
  };

  return (
    <section className="min-h-screen">
      <BgGradient className="from-rose-500 via-red-500 to-pink-500 opacity-20" />
      <MotionDiv
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-8"
      >
        {/* Header */}
        <MotionDiv variants={itemsVariants} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FolderOpen className="h-8 w-8 text-rose-600" />
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900">
                  My Documents
                </h1>
              </div>
              <p className="text-gray-600">Manage your saved legal documents</p>
            </div>
            <Link href="/generate">
              <Button className="bg-linear-to-r from-slate-900 to-rose-900 hover:from-rose-600 hover:to-slate-900 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create New Document
              </Button>
            </Link>
          </div>
        </MotionDiv>

        {/* Documents Grid */}
        <MotionDiv variants={itemsVariants}>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <Card className="p-12 text-center bg-white">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No documents yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first legal document to get started
              </p>
              <Link href="/generate">
                <Button className="bg-linear-to-r from-slate-900 to-rose-900 hover:from-rose-600 hover:to-slate-900 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Document
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="p-6 bg-white hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <FileText className="h-6 w-6 text-rose-600" />
                    <Badge
                      variant="secondary"
                      className="bg-rose-100 text-rose-700 text-xs"
                    >
                      {doc.document_type?.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {doc.document_type?.replace(/_/g, " ").toUpperCase() ||
                      "Untitled Document"}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {truncateText(doc.document_text, 120)}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-500">
                    <span>{doc.checklist_items_included} checklist items</span>
                    {doc.governing_acts && doc.governing_acts.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{doc.governing_acts.length} acts</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button
                      size="sm"
                      onClick={() => router.push(`/documents/${doc.id}/edit`)}
                      className="flex-1 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </MotionDiv>
      </MotionDiv>
    </section>
  );
}
