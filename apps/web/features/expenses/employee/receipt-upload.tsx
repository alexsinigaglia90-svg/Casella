"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";

interface ReceiptUploadProps {
  onPathChange: (path: string) => void;
}

export function ReceiptUpload({ onPathChange }: ReceiptUploadProps) {
  const [stubPath, setStubPath] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await fetch("/api/expenses/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const data = (await res.json()) as { skipped?: string; path?: string; signedUrl?: string };

      if (data.skipped) {
        // Storage not yet configured — use the generated stub path
        const path = data.path ?? `stub/${file.name}`;
        setStubPath(path);
        onPathChange(path);
        return;
      }

      if (data.signedUrl && data.path) {
        await fetch(data.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        onPathChange(data.path);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div
        className="rounded-lg border px-3 py-2 text-sm"
        style={{
          borderColor: "var(--aurora-violet)",
          backgroundColor: "rgba(139, 92, 246, 0.08)",
          color: "var(--fg-secondary)",
        }}
      >
        Supabase Storage nog niet geconfigureerd — upload werkt na Fase 2 deploy. Selecteer een bestand om een stub-pad te genereren, of vul handmatig in voor testdoeleinden.
      </div>
      <input
        type="file"
        accept="image/*,application/pdf"
        disabled={uploading}
        onChange={handleFileChange}
        className="block w-full text-sm"
        style={{ color: "var(--fg-primary)" }}
      />
      <div>
        <label
          className="mb-1 block text-xs"
          style={{ color: "var(--fg-tertiary)" }}
        >
          Of vul stub-pad handmatig in (voor test)
        </label>
        <Input
          value={stubPath}
          onChange={(e) => {
            setStubPath(e.target.value);
            onPathChange(e.target.value);
          }}
          placeholder="stub/employee-id/bestand.pdf"
        />
      </div>
    </div>
  );
}
