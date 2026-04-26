"use client";

import { AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface CriticalConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  emphasisWord: string;
  impactSummary: React.ReactNode;
  confirmPhrase: string;
  confirmLabel: string;
  scheduledAtDefault?: string;
  reasonLabel?: string;
  onConfirm: (args: { scheduledAt: string; reason: string }) => Promise<void>;
  variant?: "danger" | "warning";
}

export function CriticalConfirmDialog({
  open,
  onOpenChange,
  title,
  emphasisWord,
  impactSummary,
  confirmPhrase,
  confirmLabel,
  scheduledAtDefault,
  reasonLabel,
  onConfirm,
  variant = "danger",
}: CriticalConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const [scheduledAt, setScheduledAt] = useState(scheduledAtDefault ?? new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTyped("");
      setReason("");
    }
  }, [open]);

  const canSubmit = typed.trim().toLowerCase() === confirmPhrase.trim().toLowerCase();

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onConfirm({ scheduledAt, reason });
      onOpenChange(false);
      setTyped("");
      setReason("");
    } finally {
      setSubmitting(false);
    }
  }

  const color = variant === "danger" ? "text-aurora-rose" : "text-aurora-amber";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className={`h-6 w-6 shrink-0 ${color}`} />
          <div className="flex-1 space-y-1">
            <DialogTitle className="font-display text-title">
              {title.split(emphasisWord).flatMap((part, i) => (
                i === 0 ? [part] : [<em key={i} className={color}>{emphasisWord}</em>, part]
              ))}
            </DialogTitle>
            <DialogDescription className="text-sm text-fg-secondary">
              Dit is een kritieke actie. Lees de impact-samenvatting, kies een
              datum, en bevestig door <strong>{confirmPhrase}</strong> exact over
              te typen.
            </DialogDescription>
          </div>
        </div>

        <section className="mt-6 space-y-3 rounded-lg border border-border bg-surface-deep p-4 text-sm">
          {impactSummary}
        </section>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- Input is a wrapped Radix/shadcn primitive; control is nested inside the label which is a valid a11y pattern that the rule's heuristic does not detect */}
          <label className="space-y-1.5">
            <span className="text-xs font-medium">Uitvoeren op</span>
            <Input
              type="date"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </label>
          {reasonLabel && (
            <label className="space-y-1.5 col-span-2">
              <span className="text-xs font-medium">{reasonLabel}</span>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
            </label>
          )}
        </div>

        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- Input is a wrapped primitive; control is nested inside label (valid pattern, rule heuristic limitation) */}
        <label className="mt-4 block space-y-1.5">
          <span className="text-xs font-medium">
            Typ <code className="font-mono text-aurora-rose">{confirmPhrase}</code> om te bevestigen
          </span>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={confirmPhrase}
            autoComplete="off"
          />
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Annuleren
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "default"}
            disabled={!canSubmit || submitting}
            onClick={handleConfirm}
          >
            {submitting ? "Bezig..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
