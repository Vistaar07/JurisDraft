"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BgGradient from "@/components/common/bg-gradient";
import { MotionDiv } from "@/components/common/motion-wrapper";
import { containerVariants, itemsVariants } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  success: boolean;
  document_type: string;
  document_text: string;
  checklist_items_included: number;
  governing_acts: string[];
  metadata: Record<string, unknown>;
};

type ComplianceReport = {
  id: string;
  success: boolean;
  document_type: string;
  compliance_checks: Array<{
    requirement: string;
    status: string;
    details: string;
  }>;
  loopholes: Array<{
    title: string;
    risk_level: string;
  }>;
  overall_risk_score: number;
  risk_level: string;
  summary: string;
  recommendations: string[];
  createdAt: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<StoredDoc[]>([]);
  const [complianceReports, setComplianceReports] = useState<
    ComplianceReport[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Load generated documents
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

      // Load compliance reports
      const savedComplianceIds = JSON.parse(
        localStorage.getItem("jurisdraft_saved_compliance_dashboard") || "[]"
      );
      const reports: ComplianceReport[] = [];

      for (const complianceId of savedComplianceIds) {
        const raw = localStorage.getItem(
          `jurisdraft_compliance_${complianceId}`
        );
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            reports.push(parsed);
          } catch (e) {
            console.error(
              `Failed to parse compliance report ${complianceId}`,
              e
            );
          }
        }
      }

      setComplianceReports(reports);
    } catch (e) {
      console.error("Failed to load data", e);
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

  const handleDeleteCompliance = (complianceId: string) => {
    if (!confirm("Are you sure you want to delete this compliance report?"))
      return;

    try {
      // Remove from localStorage
      localStorage.removeItem(`jurisdraft_compliance_${complianceId}`);

      // Update saved compliance list
      const savedComplianceIds = JSON.parse(
        localStorage.getItem("jurisdraft_saved_compliance_dashboard") || "[]"
      );
      const updated = savedComplianceIds.filter(
        (id: string) => id !== complianceId
      );
      localStorage.setItem(
        "jurisdraft_saved_compliance_dashboard",
        JSON.stringify(updated)
      );

      // Update state
      setComplianceReports(
        complianceReports.filter((report) => report.id !== complianceId)
      );
    } catch (e) {
      console.error("Failed to delete compliance report", e);
      alert("Failed to delete compliance report. Please try again.");
    }
  };

  const truncateText = (text: string, maxLength: number) => {
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

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <>
            {/* Compliance Reports Section */}
            <MotionDiv variants={itemsVariants} className="mb-12">
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
                      className="p-6 bg-white hover:shadow-lg transition-shadow duration-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <Shield className="h-6 w-6 text-rose-600" />
                        <Badge
                          className={`${getRiskBadgeColor(
                            report.risk_level
                          )} text-xs`}
                        >
                          {report.risk_level}
                        </Badge>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {report.document_type
                          ?.replace(/_/g, " ")
                          .toUpperCase() || "Compliance Report"}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Risk Score:</span>
                          <span className="font-semibold text-gray-900">
                            {report.overall_risk_score}/10
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Loopholes:</span>
                          <span className="font-semibold text-gray-900">
                            {report.loopholes.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Checks:</span>
                          <span className="font-semibold text-gray-900">
                            {report.compliance_checks.length}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-500 mb-4">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>

                      <div className="flex items-center gap-2 pt-4 border-t">
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

            {/* Generated Documents Section */}
            <MotionDiv variants={itemsVariants}>
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

                      <div className="flex items-center gap-2 pt-4 border-t">
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/documents/${doc.id}/edit`)
                          }
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
          </>
        )}
      </MotionDiv>
    </section>
  );
}
