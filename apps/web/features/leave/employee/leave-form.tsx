"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LEAVE_TYPES,
  LEAVE_TYPE_KEYS,
  type LeaveTypeKey,
} from "@/lib/leave/types";

export function LeaveForm() {
  const router = useRouter();
  const [type, setType] = useState<LeaveTypeKey>("vacation_legal");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hours, setHours] = useState("8");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const config = LEAVE_TYPES[type];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startDate || !hours) {
      toast.error("Vul startdatum en uren in");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/verlof/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          startDate,
          endDate: endDate || null,
          hours: Number(hours),
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Aanvraag mislukt");
        return;
      }
      const data = (await res.json()) as { status: "approved" | "pending" };
      toast.success(
        data.status === "approved"
          ? "Verlof direct goedgekeurd"
          : "Aanvraag ingediend ter beoordeling",
      );
      setStartDate("");
      setEndDate("");
      setHours("8");
      setNotes("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border p-5 glass-card"
      style={{
        borderColor: "var(--border-subtle)",
        backgroundColor: "var(--surface-card)",
      }}
    >
      <h2
        className="mb-4 text-lg font-semibold"
        style={{ color: "var(--fg-primary)" }}
      >
        Verlof aanvragen
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--fg-secondary)" }}
          >
            Type verlof
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as LeaveTypeKey)}
            className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--border-subtle)",
              backgroundColor: "var(--surface-card)",
              color: "var(--fg-primary)",
            }}
          >
            {LEAVE_TYPE_KEYS.map((k) => (
              <option key={k} value={k}>
                {LEAVE_TYPES[k].label}
              </option>
            ))}
          </select>
          <p
            className="mt-2 text-xs leading-relaxed"
            style={{ color: "var(--fg-tertiary)" }}
          >
            {config.description}
          </p>
          <p
            className="mt-1 text-xs font-medium"
            style={{ color: "var(--fg-secondary)" }}
          >
            {config.approvalMode === "self"
              ? "Direct goedgekeurd na indienen"
              : "Beoordeling door admin nodig"}
          </p>
        </div>
        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--fg-secondary)" }}
          >
            Startdatum
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--fg-secondary)" }}
          >
            Einddatum (optioneel)
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--fg-secondary)" }}
          >
            Aantal uren
          </label>
          <Input
            type="number"
            min={1}
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--fg-secondary)" }}
          >
            Toelichting (optioneel)
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Korte toelichting bij je aanvraag…"
          />
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <Button
          type="submit"
          disabled={submitting}
          style={{
            backgroundColor: "var(--aurora-violet, #7c3aed)",
            color: "#fff",
          }}
        >
          {submitting ? "Indienen…" : "Verlof aanvragen"}
        </Button>
      </div>
    </form>
  );
}
