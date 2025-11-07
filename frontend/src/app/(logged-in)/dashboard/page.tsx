"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BgGradient from "@/components/common/bg-gradient";
import { MotionDiv } from "@/components/common/motion-wrapper";
import { containerVariants, itemsVariants } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import {
  FileText,
  Edit,
  Trash2,
  FolderOpen,
  Plus,
  Shield,
  AlertTriangle,
  Eye,
} from "lucide-react";
import Link from "next/link";

type StoredDoc = {
  id: string;
  user_id: string;
  document_type: string;
  document_text: string;
  title?: string;
  status?: string;
  checklist_items_included: number;
  governing_acts: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type ComplianceReport = {
  id: string;
  user_id: string;
  document_id?: string;
  document_type: string;
  overall_risk_score: number;
  risk_level: string;
  summary: string;
  created_at: string;
  updated_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<StoredDoc[]>([]);
  const [complianceReports, setComplianceReports] = useState<
    ComplianceReport[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"document" | "compliance">(
    "document"
  );
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteItemName, setDeleteItemName] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [docsResponse, reportsResponse] = await Promise.all([
          fetch("/api/documents"),
          fetch("/api/compliance"),
        ]);

        if (!docsResponse.ok) {
          throw new Error("Failed to fetch documents");
        }
        if (!reportsResponse.ok) {
          throw new Error("Failed to fetch compliance reports");
        }

        const docsData = await docsResponse.json();
        const reportsData = await reportsResponse.json();

        setDocuments(docsData);
        setComplianceReports(reportsData);
      } catch (err: unknown) {
        console.error("Failed to load dashboard data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    const name =
      doc?.title ||
      doc?.document_type?.replace(/_/g, " ").toUpperCase() ||
      "this document";

    setDeleteType("document");
    setDeleteItemId(docId);
    setDeleteItemName(name);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCompliance = async (complianceId: string) => {
    const report = complianceReports.find((r) => r.id === complianceId);
    const name =
      report?.document_type?.replace(/_/g, " ").toUpperCase() ||
      "this compliance report";

    setDeleteType("compliance");
    setDeleteItemId(complianceId);
    setDeleteItemName(name);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;

    setIsDeleting(true);

    try {
      if (deleteType === "document") {
        const response = await fetch(`/api/documents/${deleteItemId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete document");
        }

        setDocuments(documents.filter((doc) => doc.id !== deleteItemId));
      } else {
        const response = await fetch(`/api/compliance/${deleteItemId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete compliance report");
        }

        setComplianceReports(
          complianceReports.filter((report) => report.id !== deleteItemId)
        );
      }

      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setDeleteItemId(null);
      setDeleteItemName("");
    } catch (e) {
      console.error(`Failed to delete ${deleteType}`, e);
      alert(
        e instanceof Error
          ? e.message
          : `Failed to delete ${deleteType}. Please try again.`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const truncateText = (text: string | undefined | null, maxLength: number) => {
    if (!text) return "No content available";
    const plainText = text.replace(/<[^>]*>/g, "").replace(/\n/g, " ");
    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + "..."
      : plainText;
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    const level = riskLevel.toLowerCase();
    if (level === "high") return "bg-red-100 text-red-800 border-red-200";
    if (level === "medium")
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-green-100 text-green-800 border-green-200";
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
                  Dashboard
                </h1>
              </div>
              <p className="text-gray-600">
                Manage your documents and compliance reports
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/upload">
                <Button variant="outline" className="bg-white">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Check Compliance
                </Button>
              </Link>
              <Link href="/generate">
                <Button className="bg-rose-600 hover:bg-rose-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Document
                </Button>
              </Link>
            </div>
          </div>
        </MotionDiv>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-rose-600 border-r-transparent mb-4"></div>
            <p className="text-gray-500 text-lg">Loading your dashboard...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-300 mx-auto mb-4" />
            <p className="text-red-500 text-lg font-semibold mb-2">
              Error: {error}
            </p>
            <p className="text-gray-500 mb-4">
              Failed to load your dashboard data.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Compliance Reports Section */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-7 w-7 text-rose-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Compliance Reports ({complianceReports.length})
                </h2>
              </div>

              {complianceReports.length === 0 ? (
                <Card className="p-8 text-center bg-white">
                  <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No compliance reports yet
                  </h3>
                  <p className="text-gray-500 mb-4 text-sm">
                    Analyze documents for compliance issues and loopholes
                  </p>
                  <Link href="/upload">
                    <Button variant="outline" className="bg-white">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Check Compliance
                    </Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {complianceReports.map((report) => (
                    <Card
                      key={report.id}
                      className="p-6 bg-white hover:shadow-lg transition-shadow duration-200 flex flex-col h-full"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <Shield className="h-6 w-6 text-rose-600" />
                        <Badge
                          className={`${getRiskBadgeColor(
                            report.risk_level
                          )} text-xs`}
                        >
                          {report.risk_level.toUpperCase()}
                        </Badge>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {report.document_type
                          ?.replace(/_/g, " ")
                          .toUpperCase() || "Compliance Report"}
                      </h3>

                      <div className="space-y-2 mb-4 grow">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Risk Score:</span>
                          <span className="font-semibold text-gray-900">
                            {report.overall_risk_score}/10
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Summary:</span>
                          <p className="font-medium text-gray-900 mt-1 line-clamp-2">
                            {report.summary || "No summary available"}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mb-4">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>

                      <div className="flex items-center gap-2 pt-4 border-t mt-auto">
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/compliance/${report.id}/analysis`)
                          }
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Report
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCompliance(report.id)}
                          className="bg-rose-600 text-white hover:bg-white hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Generated Documents Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <FileText className="h-7 w-7 text-rose-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Generated Documents ({documents.length})
                </h2>
              </div>

              {documents.length === 0 ? (
                <Card className="p-8 text-center bg-white">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No documents yet
                  </h3>
                  <p className="text-gray-500 mb-4 text-sm">
                    Create your first legal document to get started
                  </p>
                  <Link href="/generate">
                    <Button className="bg-rose-600 hover:bg-rose-700 text-white">
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
                      className="p-6 bg-white hover:shadow-lg transition-shadow duration-200 flex flex-col h-full"
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
                        {doc.title ||
                          doc.document_type?.replace(/_/g, " ").toUpperCase() ||
                          "Untitled Document"}
                      </h3>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-3 grow">
                        {truncateText(doc.document_text, 120)}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-500">
                        <span>
                          {doc.checklist_items_included} checklist items
                        </span>
                        {doc.governing_acts &&
                          doc.governing_acts.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{doc.governing_acts.length} acts</span>
                            </>
                          )}
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t mt-auto">
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/documents/${doc.id}/edit`)
                          }
                          className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(doc.id)}
                          className="bg-rose-600 text-white hover:bg-white hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </MotionDiv>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteItemId(null);
          setDeleteItemName("");
        }}
        onConfirm={confirmDelete}
        title={
          deleteType === "document"
            ? "Delete Document"
            : "Delete Compliance Report"
        }
        description={
          deleteType === "document"
            ? "Are you sure you want to delete this document? This action cannot be undone."
            : "Are you sure you want to delete this compliance report? This action cannot be undone."
        }
        itemName={deleteItemName}
        isDeleting={isDeleting}
      />
    </section>
  );
}
