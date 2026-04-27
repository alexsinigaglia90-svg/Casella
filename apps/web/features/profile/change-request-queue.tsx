"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface ChangeRequestItem {
  id: string;
  type: "address" | "iban";
  proposedValue: Record<string, unknown>;
  createdAt: string;
  employeeName: string;
}

interface Props {
  items: ChangeRequestItem[];
}

function formatProposedValue(type: "address" | "iban", value: Record<string, unknown>): string {
  if (type === "address") {
    const { street, houseNumber, houseNumberSuffix, postalCode, city } = value as {
      street?: string;
      houseNumber?: string;
      houseNumberSuffix?: string;
      postalCode?: string;
      city?: string;
    };
    return `${street ?? ""} ${houseNumber ?? ""}${houseNumberSuffix ? ` ${houseNumberSuffix}` : ""}, ${postalCode ?? ""} ${city ?? ""}`.trim();
  }
  return `IBAN: ${String(value.iban ?? "")}`;
}

function timeAgo(iso: string): string {
  const diffMin = (Date.now() - new Date(iso).getTime()) / 60_000;
  if (diffMin < 1) return "zojuist";
  if (diffMin < 60) return `${Math.floor(diffMin)}m geleden`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}u geleden`;
  return `${Math.floor(diffMin / (60 * 24))}d geleden`;
}

export function ChangeRequestQueue({ items }: Props) {
  const router = useRouter();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
        Geen openstaande wijzigingsverzoeken.
      </p>
    );
  }

  async function handleApprove(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/change-requests/${id}/approve`, { method: "POST" });
      if (!res.ok) {
        toast.error("Goedkeuren mislukt");
        return;
      }
      toast.success("Verzoek goedgekeurd");
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) {
      toast.error("Geef een reden op");
      return;
    }
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/change-requests/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) {
        toast.error("Afwijzen mislukt");
        return;
      }
      toast.success("Verzoek afgewezen");
      setRejectingId(null);
      setRejectReason("");
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-xl border p-4"
          style={{
            background: "var(--surface-base)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
                {item.employeeName}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--fg-secondary)" }}>
                {item.type === "address" ? "Adreswijziging" : "IBAN-wijziging"} ·{" "}
                {timeAgo(item.createdAt)}
              </p>
              <p
                className="mt-2 rounded px-2 py-1 text-xs font-mono"
                style={{ background: "var(--surface-lift)", color: "var(--fg-secondary)" }}
              >
                {formatProposedValue(item.type, item.proposedValue)}
              </p>

              {rejectingId === item.id && (
                <div className="mt-3 space-y-2">
                  <textarea
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--surface-lift)",
                      color: "var(--fg-primary)",
                    }}
                    placeholder="Reden voor afwijzing…"
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={loadingId === item.id}
                      onClick={() => handleReject(item.id)}
                    >
                      Bevestig afwijzen
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason("");
                      }}
                    >
                      Annuleren
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {rejectingId !== item.id && (
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  disabled={!!loadingId}
                  onClick={() => handleApprove(item.id)}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Goedkeuren
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!!loadingId}
                  onClick={() => setRejectingId(item.id)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Afwijzen
                </Button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
