"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DOMAIN_HUES, oklchEmphasis, oklchSubtleBg } from "@/lib/design/oklch";

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

  const hue = DOMAIN_HUES.cool;

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
      className="relative overflow-hidden rounded-2xl border p-6"
      style={{
        borderColor: `${oklchEmphasis(hue)}33`,
        background: `linear-gradient(135deg, ${oklchSubtleBg(hue)} 0%, var(--surface-card) 70%)`,
      }}
    >
      <div
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.22em",
          color: oklchEmphasis(hue),
        }}
      >
        Ziek melden · vertrouwelijk
      </div>
      <h2
        className="mt-2 font-display"
        style={{
          fontSize: "1.75rem",
          fontWeight: 500,
          lineHeight: 1.05,
          color: "var(--fg-primary)",
        }}
      >
        <em>Ik wens je beterschap</em>
      </h2>
      <p
        className="mt-2 max-w-xl"
        style={{ fontSize: 13, color: "var(--fg-secondary)" }}
      >
        Conform AVG vragen we geen medische details. Alleen je beschikbaarheid
        en verwachte duur — voor je manager om mee te denken.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="sick-start"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--fg-tertiary)" }}
          >
            Startdatum
          </label>
          <Input
            id="sick-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor="sick-expected"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--fg-tertiary)" }}
          >
            Verwachte duur (dagen, optioneel)
          </label>
          <Input
            id="sick-expected"
            type="number"
            min={1}
            max={365}
            value={expectedDays}
            onChange={(e) => setExpectedDays(e.target.value)}
            placeholder="bijv. 3"
          />
        </div>
        <div className="sm:col-span-2">
          <span
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--fg-tertiary)" }}
          >
            Beschikbaarheid
          </span>
          <div className="space-y-2">
            {(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 rounded-lg border bg-white/40 px-3 py-2 text-sm transition-colors"
                style={{
                  color: "var(--fg-primary)",
                  borderColor:
                    availability === opt
                      ? oklchEmphasis(hue)
                      : "var(--border-subtle)",
                  background:
                    availability === opt
                      ? oklchSubtleBg(hue)
                      : "rgba(255,255,255,0.4)",
                }}
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

      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          disabled={submitting}
          style={{
            background: oklchEmphasis(hue),
            color: "white",
          }}
        >
          {submitting ? "Versturen…" : "Ziek melden"}
        </Button>
      </div>
    </form>
  );
}
