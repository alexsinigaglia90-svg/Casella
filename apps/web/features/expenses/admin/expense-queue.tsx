"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EXPENSE_CATEGORY_MAP, type ExpenseCategoryKey } from "@/lib/expenses/types";

export interface ExpenseQueueItem {
  id: string;
  employeeName: string;
  category: string;
  amountCents: number;
  date: string;
  description: string;
  receiptStoragePath: string;
  projectName: string | null;
  isInternal: boolean;
  submittedAt: string;
}

function formatEur(cents: number) {
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function ExpenseCard({ item }: { item: ExpenseQueueItem }) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [vatEur, setVatEur] = useState("");
  const [reason, setReason] = useState("");

  const catConfig = EXPENSE_CATEGORY_MAP[item.category as ExpenseCategoryKey];

  async function handleApprove() {
    setApproving(true);
    try {
      const vatAmountCents = vatEur ? Math.round(parseFloat(vatEur) * 100) : undefined;
      const res = await fetch(`/api/admin/declaraties/${item.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vatAmountCents }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Goedkeuren mislukt");
        return;
      }
      toast.success("Declaratie goedgekeurd");
      setShowApproveDialog(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!reason.trim()) {
      toast.error("Vul een reden in");
      return;
    }
    setRejecting(true);
    try {
      const res = await fetch(`/api/admin/declaraties/${item.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Afwijzen mislukt");
        return;
      }
      toast.success("Declaratie afgewezen");
      setShowRejectDialog(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setRejecting(false);
    }
  }

  return (
    <>
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: "var(--border-subtle)",
          backgroundColor: "var(--surface-card)",
        }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold" style={{ color: "var(--fg-primary)" }}>
              {item.employeeName}
            </p>
            <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
              {catConfig?.label ?? item.category} — {item.date}
            </p>
          </div>
          <p className="text-lg font-bold" style={{ color: "var(--aurora-violet)" }}>
            {formatEur(item.amountCents)}
          </p>
        </div>
        <p className="mb-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          {item.isInternal ? "Intern Ascentra" : (item.projectName ?? "—")}
        </p>
        <p className="mb-4 text-sm" style={{ color: "var(--fg-secondary)" }}>
          {item.description}
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowApproveDialog(true)}>
            Goedkeuren
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRejectDialog(true)}
          >
            Afwijzen
          </Button>
        </div>
      </div>

      {showApproveDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowApproveDialog(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6"
            style={{ backgroundColor: "var(--surface-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 font-semibold" style={{ color: "var(--fg-primary)" }}>
              Declaratie goedkeuren
            </h3>
            <label className="mb-1 block text-sm" style={{ color: "var(--fg-secondary)" }}>
              BTW-bedrag (optioneel, in €)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={vatEur}
              onChange={(e) => setVatEur(e.target.value)}
              placeholder="0,00"
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={handleApprove} disabled={approving}>
                {approving ? "Bezig…" : "Bevestig goedkeuring"}
              </Button>
              <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                Annuleren
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRejectDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowRejectDialog(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6"
            style={{ backgroundColor: "var(--surface-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 font-semibold" style={{ color: "var(--fg-primary)" }}>
              Declaratie afwijzen
            </h3>
            <label className="mb-1 block text-sm" style={{ color: "var(--fg-secondary)" }}>
              Reden (verplicht)
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Geef een reden voor de afwijzing"
              rows={3}
              className="mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={handleReject} disabled={rejecting || !reason.trim()}>
                {rejecting ? "Bezig…" : "Bevestig afwijzing"}
              </Button>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Annuleren
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ExpenseQueue({ items }: { items: ExpenseQueueItem[] }) {
  if (items.length === 0) {
    return (
      <div
        className="rounded-xl border p-8 text-center text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--fg-tertiary)",
        }}
      >
        Geen openstaande declaraties.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ExpenseCard key={item.id} item={item} />
      ))}
    </div>
  );
}
