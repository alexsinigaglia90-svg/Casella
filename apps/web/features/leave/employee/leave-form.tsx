"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ConfettiBurst } from "@/components/design";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DOMAIN_HUES, oklchEmphasis, oklchSubtleBg } from "@/lib/design/oklch";
import { LEAVE_TYPE_HUES } from "@/lib/leave/type-hues";
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
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  const config = LEAVE_TYPES[type];
  const hue = LEAVE_TYPE_HUES[type];

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
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        toast.error(body.message ?? "Aanvraag mislukt");
        return;
      }
      const data = (await res.json()) as { status: "approved" | "pending" };
      toast.success(
        data.status === "approved"
          ? "Verlof direct goedgekeurd"
          : "Aanvraag ingediend ter beoordeling",
      );
      setConfettiTrigger((t) => t + 1);
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
    <>
      <ConfettiBurst trigger={confettiTrigger} count={24} />
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border p-7"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-card)",
        }}
      >
        <div className="mb-5">
          <div
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "var(--fg-tertiary)",
            }}
          >
            Nieuwe aanvraag
          </div>
          <h2
            className="mt-1.5 font-display"
            style={{
              fontSize: 26,
              fontWeight: 500,
              color: "var(--fg-primary)",
            }}
          >
            Verlof aanvragen
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              className="mb-1.5 block font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--fg-tertiary)",
              }}
            >
              Type verlof
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as LeaveTypeKey)}
              className="flex h-10 w-full rounded-md border px-3 py-2 text-sm"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--surface-card)",
                color: "var(--fg-primary)",
              }}
            >
              {LEAVE_TYPE_KEYS.map((k) => (
                <option key={k} value={k}>
                  {LEAVE_TYPES[k].label}
                </option>
              ))}
            </select>
            <div
              className="mt-2 rounded-lg p-3"
              style={{
                background: oklchSubtleBg(hue),
                fontSize: 12,
                color: oklchEmphasis(hue),
              }}
            >
              <div style={{ lineHeight: 1.5 }}>{config.description}</div>
              <div
                className="mt-1.5 font-mono uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.08em",
                }}
              >
                {config.approvalMode === "self"
                  ? "Direct goedgekeurd na indienen"
                  : "Beoordeling door admin nodig"}
              </div>
            </div>
          </div>

          <div>
            <label
              className="mb-1.5 block font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--fg-tertiary)",
              }}
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
              className="mb-1.5 block font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--fg-tertiary)",
              }}
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
              className="mb-1.5 block font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--fg-tertiary)",
              }}
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
              className="mb-1.5 block font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--fg-tertiary)",
              }}
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

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={submitting}
            style={{
              background: oklchEmphasis(DOMAIN_HUES.harvest),
              color: "#fff",
            }}
          >
            {submitting ? "Indienen…" : "Verlof aanvragen"}
          </Button>
        </div>
      </form>
    </>
  );
}
