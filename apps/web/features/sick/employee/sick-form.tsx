"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Availability = "home" | "unavailable" | "unknown";

const AVAILABILITY_LABEL: Record<Availability, string> = {
  home: "Ik werk eventueel thuis (lichte taken)",
  unavailable: "Niet beschikbaar voor werk",
  unknown: "Onbekend / nog niet duidelijk",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SickForm() {
  const router = useRouter();
  const [startDate, setStartDate] = useState(todayIso());
  const [expectedDays, setExpectedDays] = useState("");
  const [availability, setAvailability] = useState<Availability>("unknown");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/verzuim/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          expectedDurationDays: expectedDays
            ? Number.parseInt(expectedDays, 10)
            : null,
          availabilityStatus: availability,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Ziekmelding mislukt");
        return;
      }
      toast.success("Ziekmelding ontvangen — beterschap!");
      setExpectedDays("");
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
        className="mb-1 text-lg font-semibold"
        style={{ color: "var(--fg-primary)" }}
      >
        Ziek melden
      </h2>
      <p className="mb-4 text-xs" style={{ color: "var(--fg-tertiary)" }}>
        Conform AVG vragen we geen medische details. Alleen je beschikbaarheid
        en verwachte duur.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            Verwachte duur (dagen, optioneel)
          </label>
          <Input
            type="number"
            min={1}
            max={365}
            value={expectedDays}
            onChange={(e) => setExpectedDays(e.target.value)}
            placeholder="bijv. 3"
          />
        </div>
        <div className="sm:col-span-2">
          <label
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--fg-secondary)" }}
          >
            Beschikbaarheid
          </label>
          <div className="space-y-2">
            {(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--fg-primary)" }}
              >
                <input
                  type="radio"
                  name="availability"
                  value={opt}
                  checked={availability === opt}
                  onChange={() => setAvailability(opt)}
                />
                {AVAILABILITY_LABEL[opt]}
              </label>
            ))}
          </div>
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
          {submitting ? "Versturen…" : "Ziek melden"}
        </Button>
      </div>
    </form>
  );
}
