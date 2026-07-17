"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Paperclip, Trash2 } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import {
  buildDocumentPath,
  deleteDocument,
  listShipmentDocuments,
  recordDocument,
  type DocumentWithUrl,
} from "./actions";
import { DOC_TYPE_LABEL, DOC_TYPES, type DocType } from "./types";

export function DocumentsSection({ shipmentId }: { shipmentId: string }) {
  const [docs, setDocs] = useState<DocumentWithUrl[] | null>(null);
  const [docType, setDocType] = useState<DocType>("invoice");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    listShipmentDocuments(shipmentId).then((result) => {
      if (cancelled) return;
      if ("error" in result) {
        setError(result.error);
        setDocs([]);
      } else {
        setDocs(result);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [shipmentId]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const pathResult = await buildDocumentPath(shipmentId, file.name);
      if ("error" in pathResult) {
        setError(pathResult.error);
        return;
      }

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(pathResult.path, file, { contentType: file.type || undefined });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const fd = new FormData();
      fd.set("shipmentId", shipmentId);
      fd.set("filePath", pathResult.path);
      fd.set("fileName", file.name);
      fd.set("docType", docType);
      const result = await recordDocument(fd);
      if (result.error) {
        setError(result.error);
        return;
      }

      const refreshed = await listShipmentDocuments(shipmentId);
      if (!("error" in refreshed)) setDocs(refreshed);
    } finally {
      setIsUploading(false);
    }
  }

  function handleDelete(doc: DocumentWithUrl) {
    setDeletingId(doc.id);
    startTransition(async () => {
      setDocs((prev) => prev?.filter((d) => d.id !== doc.id) ?? prev);
      await deleteDocument(doc.id);
      setDeletingId(null);
    });
  }

  return (
    <div className="mt-6 border-t border-border pt-5">
      <p className="mb-3 text-sm font-medium text-primary">Documents</p>

      {error && (
        <p className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
      )}

      {docs === null ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="mb-3 text-xs text-muted-foreground">No documents attached yet.</p>
      ) : (
        <ul className="mb-3 space-y-1.5">
          <AnimatePresence initial={false}>
            {docs.map((doc) => (
              <motion.li
                key={doc.id}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ type: "spring", stiffness: 340, damping: 32 }}
                className="flex items-center gap-2 rounded-lg bg-surface-muted px-3 py-2 text-xs"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 truncate text-foreground underline underline-offset-2"
                  >
                    {doc.fileName}
                  </a>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-foreground">{doc.fileName}</span>
                )}
                <span className="shrink-0 text-muted-foreground">
                  {DOC_TYPE_LABEL[doc.docType]}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(doc)}
                  disabled={deletingId === doc.id}
                  aria-label={`Delete ${doc.fileName}`}
                  className="shrink-0 rounded p-1 text-muted-foreground outline-none transition-colors hover:bg-danger/10 hover:text-danger focus-visible:ring-2 focus-visible:ring-accent/40 active:scale-90 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Select
          value={docType}
          onChange={(e) => setDocType(e.target.value as DocType)}
          className="w-auto flex-1"
          aria-label="Document type"
        >
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>
              {DOC_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          pending={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {!isUploading && <Paperclip className="h-3.5 w-3.5" />}
          Attach
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
