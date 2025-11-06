"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BgGradient from "@/components/common/bg-gradient";
import { MotionDiv } from "@/components/common/motion-wrapper";
import { containerVariants } from "@/utils/constants";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type StoredDoc = {
  id: string;
  success: boolean;
  document_type: string;
  document_text: string;
  checklist_items_included: number;
  governing_acts: string[];
  metadata: Record<string, unknown>;
};

export default function EditDocumentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;
  const storageKey = useMemo(() => `jurisdraft_document_${id}`, [id]);

  const [doc, setDoc] = useState<StoredDoc | null>(null);
  const [content, setContent] = useState("\n");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredDoc;
        setDoc(parsed);
        setContent(parsed.document_text || "");
      }
    } catch (e) {
      console.error("Failed to load document from storage", e);
    }
  }, [id, storageKey]);

  const handleSave = () => {
    if (!doc) return;
    setSaving(true);
    try {
      const updated = { ...doc, document_text: content };
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => router.push("/generate");

  return (
    <section className="min-h-screen">
      <BgGradient />
      <MotionDiv
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-5xl px-6 py-24 sm:py-32 lg:px-8"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Edit document
          </h1>
          <p className="text-muted-foreground">
            {doc ? (
              <>
                Type: <span className="font-medium">{doc.document_type}</span> •
                ID: {id}
              </>
            ) : (
              "Can't find this document in your browser storage."
            )}
          </p>
        </div>

        <div className="mt-8 grid gap-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[60vh]"
          />
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={!doc || saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="ghost" onClick={goBack}>
              Back to Generate
            </Button>
          </div>
        </div>
      </MotionDiv>
    </section>
  );
}
