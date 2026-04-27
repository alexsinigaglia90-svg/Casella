"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export interface SickListItem {
  id: string;
  startDate: string;
  endDate: string | null;
  customPayload: Record<string, unknown> | null;
}

export function SickList({ items }: { items: SickListItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function handleRecover(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/verzuim/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Hersteldmelding mislukt");
        return;
      }
      toast.success("Hersteldmelding ontvangen");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <div
        className="rounded-xl border p-6 text-center text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--fg-tertiary)",
        }}
      >
        Nog geen ziekmeldingen.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const isActive = item.endDate === null;
        const expectedDays =
          (item.customPayload?.["expectedDurationDays"] as number | null) ?? null;
        return (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3"
            style={{
              borderColor: isActive
                ? "var(--aurora-violet, #7c3aed)"
                : "var(--border-subtle)",
              backgroundColor: "var(--surface-card)",
            }}
          >
            <div className="min-w-0 flex-1">
              <div
                className="text-sm font-medium"
                style={{ color: "var(--fg-primary)" }}
              >
                {isActive ? "Nog ziek sinds" : "Ziek geweest"}: {item.startDate}
                {item.endDate && ` t/m ${item.endDate}`}
              </div>
              {expectedDays && (
                <div
                  className="text-xs"
                  style={{ color: "var(--fg-tertiary)" }}
                >
                  Verwachte duur: {expectedDays} dag(en)
                </div>
              )}
            </div>
            {isActive && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy === item.id}
                onClick={() => void handleRecover(item.id)}
              >
                {busy === item.id ? "…" : "Hersteld melden"}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
