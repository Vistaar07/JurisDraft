"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BgGradient from "@/components/common/bg-gradient";
import { MotionDiv } from "@/components/common/motion-wrapper";
import { containerVariants, itemsVariants } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  FileText,
  Shield,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

type LoopholeItem = {
  title: string;
  description: string;
  risk_level: string;
  clause_reference: string;
  recommendation: string;
};

type ComplianceItem = {
  requirement: string;
  status: string;
  details: string;
  relevant_acts: string[];
  remediation?: string;
};

type ComplianceData = {
  id: string;
  user_id: string;
  document_id?: string;
  document_type: string;
  compliance_checks: ComplianceItem[];
  loopholes: LoopholeItem[];
  overall_risk_score: number;
  risk_level: string;
  summary: string;
  recommendations: string[];
  created_at: string;
  updated_at: string;
};

export default function ComplianceAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(
    null
  );
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingDOCX, setExportingDOCX] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchReport = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/compliance/${id}`);

        if (response.status === 404) {
          throw new Error("Compliance report not found.");
        }

        if (!response.ok) {
          throw new Error("Failed to fetch compliance report");
        }

        const data = await response.json();
        setComplianceData(data);
      } catch (e) {
        console.error("Failed to load compliance report", e);
        setError(
          e instanceof Error ? e.message : "Failed to load compliance report"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const getRiskBadgeColor = (riskLevel: string) => {
    const level = riskLevel.toLowerCase();
    if (level === "high") return "bg-red-100 text-red-800 border-red-200";
    if (level === "medium")
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getRiskIcon = (riskLevel: string) => {
    const level = riskLevel.toLowerCase();
    if (level === "high") return <XCircle className="h-5 w-5" />;
    if (level === "medium") return <AlertCircle className="h-5 w-5" />;
    return <CheckCircle2 className="h-5 w-5" />;
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this compliance report? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/compliance/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete compliance report");
      }

      toast("Report Deleted", {
        description: "Compliance report has been deleted successfully",
        icon: "✅",
        duration: 2000,
      });

      // On success, redirect to the dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to delete compliance report:", error);
      toast("Error", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete report. Please try again.",
        icon: "❌",
        duration: 3000,
      });
    }
  };

  const exportToPDF = async () => {
    if (!complianceData) return;
    setExportingPDF(true);

    try {
      const pdf = new jsPDF();
      let yPosition = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;

      // Title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("Compliance Analysis Report", margin, yPosition);
      yPosition += 10;

      // Document Type
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Document Type: ${complianceData.document_type
          .replace(/_/g, " ")
          .toUpperCase()}`,
        margin,
        yPosition
      );
      yPosition += 7;

      // Date
      pdf.text(
        `Generated: ${new Date(complianceData.created_at).toLocaleString()}`,
        margin,
        yPosition
      );
      yPosition += 10;

      // Risk Score
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Overall Risk Assessment", margin, yPosition);
      yPosition += 7;
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `Risk Level: ${complianceData.risk_level} (Score: ${complianceData.overall_risk_score}/10)`,
        margin,
        yPosition
      );
      yPosition += 10;

      // Summary
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Summary", margin, yPosition);
      yPosition += 7;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const summaryLines = pdf.splitTextToSize(
        complianceData.summary,
        maxWidth
      );
      pdf.text(summaryLines, margin, yPosition);
      yPosition += summaryLines.length * 5 + 10;

      // Loopholes
      if (complianceData.loopholes.length > 0) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          `Loopholes Detected (${complianceData.loopholes.length})`,
          margin,
          yPosition
        );
        yPosition += 10;

        complianceData.loopholes.forEach((loophole, index) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          pdf.text(`${index + 1}. ${loophole.title}`, margin, yPosition);
          yPosition += 6;

          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.text(`Risk Level: ${loophole.risk_level}`, margin + 5, yPosition);
          yPosition += 5;

          const descLines = pdf.splitTextToSize(
            `Description: ${loophole.description}`,
            maxWidth - 5
          );
          pdf.text(descLines, margin + 5, yPosition);
          yPosition += descLines.length * 5 + 3;

          const recLines = pdf.splitTextToSize(
            `Recommendation: ${loophole.recommendation}`,
            maxWidth - 5
          );
          pdf.text(recLines, margin + 5, yPosition);
          yPosition += recLines.length * 5 + 8;
        });
      }

      // Compliance Checks
      if (complianceData.compliance_checks.length > 0) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          `Compliance Checks (${complianceData.compliance_checks.length})`,
          margin,
          yPosition
        );
        yPosition += 10;

        complianceData.compliance_checks.forEach((check, index) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          pdf.text(`${index + 1}. ${check.requirement}`, margin, yPosition);
          yPosition += 6;

          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.text(`Status: ${check.status}`, margin + 5, yPosition);
          yPosition += 5;

          const detailLines = pdf.splitTextToSize(check.details, maxWidth - 5);
          pdf.text(detailLines, margin + 5, yPosition);
          yPosition += detailLines.length * 5 + 8;
        });
      }

      // Recommendations
      if (complianceData.recommendations.length > 0) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Recommendations", margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        complianceData.recommendations.forEach((rec, index) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }

          const recLines = pdf.splitTextToSize(
            `${index + 1}. ${rec}`,
            maxWidth
          );
          pdf.text(recLines, margin, yPosition);
          yPosition += recLines.length * 5 + 5;
        });
      }

      pdf.save(
        `compliance-report-${complianceData.document_type}-${Date.now()}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setExportingPDF(false);
    }
  };

  const exportToDOCX = async () => {
    if (!complianceData) return;
    setExportingDOCX(true);

    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: "Compliance Analysis Report",
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Document Type: ${complianceData.document_type
                      .replace(/_/g, " ")
                      .toUpperCase()}`,
                    bold: true,
                  }),
                ],
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: `Generated: ${new Date(
                  complianceData.created_at
                ).toLocaleString()}`,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: "Overall Risk Assessment",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                text: `Risk Level: ${complianceData.risk_level} (Score: ${complianceData.overall_risk_score}/10)`,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: "Summary",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                text: complianceData.summary,
                spacing: { after: 200 },
              }),
              ...(complianceData.loopholes.length > 0
                ? [
                    new Paragraph({
                      text: `Loopholes Detected (${complianceData.loopholes.length})`,
                      heading: HeadingLevel.HEADING_2,
                      spacing: { before: 200, after: 100 },
                    }),
                    ...complianceData.loopholes.flatMap((loophole, index) => [
                      new Paragraph({
                        text: `${index + 1}. ${loophole.title}`,
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 100, after: 50 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Risk Level: ",
                            bold: true,
                          }),
                          new TextRun(loophole.risk_level),
                        ],
                        spacing: { after: 50 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Description: ",
                            bold: true,
                          }),
                          new TextRun(loophole.description),
                        ],
                        spacing: { after: 50 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Recommendation: ",
                            bold: true,
                          }),
                          new TextRun(loophole.recommendation),
                        ],
                        spacing: { after: 100 },
                      }),
                    ]),
                  ]
                : []),
              ...(complianceData.compliance_checks.length > 0
                ? [
                    new Paragraph({
                      text: `Compliance Checks (${complianceData.compliance_checks.length})`,
                      heading: HeadingLevel.HEADING_2,
                      spacing: { before: 200, after: 100 },
                    }),
                    ...complianceData.compliance_checks.flatMap(
                      (check, index) => [
                        new Paragraph({
                          text: `${index + 1}. ${check.requirement}`,
                          heading: HeadingLevel.HEADING_3,
                          spacing: { before: 100, after: 50 },
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Status: ",
                              bold: true,
                            }),
                            new TextRun(check.status),
                          ],
                          spacing: { after: 50 },
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Details: ",
                              bold: true,
                            }),
                            new TextRun(check.details),
                          ],
                          spacing: { after: 100 },
                        }),
                      ]
                    ),
                  ]
                : []),
              ...(complianceData.recommendations.length > 0
                ? [
                    new Paragraph({
                      text: "Recommendations",
                      heading: HeadingLevel.HEADING_2,
                      spacing: { before: 200, after: 100 },
                    }),
                    ...complianceData.recommendations.map(
                      (rec, index) =>
                        new Paragraph({
                          text: `${index + 1}. ${rec}`,
                          spacing: { after: 50 },
                        })
                    ),
                  ]
                : []),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(
        blob,
        `compliance-report-${complianceData.document_type}-${Date.now()}.docx`
      );
    } catch (error) {
      console.error("Error generating DOCX:", error);
      alert("Failed to generate DOCX. Please try again.");
    } finally {
      setExportingDOCX(false);
    }
  };

  if (isLoading) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Loading compliance report...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-red-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-red-500">{error}</h2>
          <p className="text-gray-600 mb-4">
            The compliance report could not be loaded.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push("/upload")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload
            </Button>
            <Button onClick={() => router.push("/dashboard")} variant="default">
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  if (!complianceData) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Data Not Found</h2>
          <p className="text-gray-600 mb-4">
            The compliance analysis data could not be loaded.
          </p>
          <Button onClick={() => router.push("/upload")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>
        </Card>
      </section>
    );
  }

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
          <Button
            variant="ghost"
            onClick={() => router.push("/upload")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-8 w-8 text-rose-600" />
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900">
                  Compliance Analysis
                </h1>
              </div>
              <p className="text-gray-600">
                {complianceData.document_type.replace(/_/g, " ").toUpperCase()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={exportToPDF}
                disabled={exportingPDF}
                variant="outline"
                className="bg-white"
              >
                {exportingPDF ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export PDF
              </Button>
              <Button
                onClick={exportToDOCX}
                disabled={exportingDOCX}
                variant="outline"
                className="bg-white"
              >
                {exportingDOCX ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export DOCX
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Report
              </Button>
            </div>
          </div>
        </MotionDiv>

        {/* Risk Overview */}
        <MotionDiv variants={itemsVariants} className="mb-8">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getRiskIcon(complianceData.risk_level)}
                Overall Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Risk Level</p>
                  <Badge
                    className={`${getRiskBadgeColor(
                      complianceData.risk_level
                    )} text-lg px-4 py-1`}
                  >
                    {complianceData.risk_level}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-2">Risk Score</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {complianceData.overall_risk_score}
                    <span className="text-lg text-gray-500">/10</span>
                  </p>
                </div>
              </div>
              <Separator className="my-4" />
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Summary
                </p>
                <p className="text-gray-600 whitespace-pre-line">
                  {complianceData.summary}
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>

        {/* Loopholes Section */}
        {complianceData.loopholes.length > 0 && (
          <MotionDiv variants={itemsVariants} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
              Loopholes Detected ({complianceData.loopholes.length})
            </h2>
            <div className="space-y-4">
              {complianceData.loopholes.map((loophole, index) => (
                <Card
                  key={index}
                  className="bg-white shadow sticky"
                  style={{ top: `${80 + index * 20}px` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        {loophole.title}
                      </CardTitle>
                      <Badge className={getRiskBadgeColor(loophole.risk_level)}>
                        {loophole.risk_level}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Description
                      </p>
                      <p className="text-sm text-gray-600">
                        {loophole.description}
                      </p>
                    </div>
                    {loophole.clause_reference !== "Not Found" && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Clause Reference
                        </p>
                        <p className="text-sm text-gray-600 italic">
                          &ldquo;{loophole.clause_reference}&rdquo;
                        </p>
                      </div>
                    )}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        💡 Recommendation
                      </p>
                      <p className="text-sm text-blue-800">
                        {loophole.recommendation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </MotionDiv>
        )}

        {/* Compliance Checks Section */}
        {complianceData.compliance_checks.length > 0 && (
          <MotionDiv variants={itemsVariants} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Compliance Checks ({complianceData.compliance_checks.length})
            </h2>
            <div className="space-y-4">
              {complianceData.compliance_checks.map((check, index) => (
                <Card key={index} className="bg-white shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        {check.requirement}
                      </CardTitle>
                      <Badge
                        className={
                          check.status === "Compliant"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : check.status === "Non-Compliant"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-yellow-100 text-yellow-800 border-yellow-200"
                        }
                      >
                        {check.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Details
                      </p>
                      <p className="text-sm text-gray-600">{check.details}</p>
                    </div>
                    {check.relevant_acts.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Relevant Acts
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {check.relevant_acts.map((act, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {act}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {check.remediation && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-green-900 mb-1">
                          🔧 Remediation
                        </p>
                        <p className="text-sm text-green-800">
                          {check.remediation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </MotionDiv>
        )}

        {/* Recommendations Section */}
        {complianceData.recommendations.length > 0 && (
          <MotionDiv variants={itemsVariants}>
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {complianceData.recommendations.map((rec, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="font-semibold text-rose-600 min-w-6">
                        {index + 1}.
                      </span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </MotionDiv>
        )}
      </MotionDiv>
    </section>
  );
}
