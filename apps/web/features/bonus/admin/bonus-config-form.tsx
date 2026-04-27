"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BonusConfigFormProps {
  initialYear: number;
  initialWerkgeverslastenPct: number;
  initialIndirecteKostenPerMaand: number;
  initialWerkbareUrenPerMaand: number;
}

export function BonusConfigForm({
  initialYear,
  initialWerkgeverslastenPct,
  initialIndirecteKostenPerMaand,
  initialWerkbareUrenPerMaand,
}: BonusConfigFormProps) {
  const router = useRouter();
  const [year, setYear] = useState(String(initialYear));
  const [werkgeverslasten, setWerkgeverslasten] = useState(
    String(initialWerkgeverslastenPct),
  );
  const [indirecteKosten, setIndirecteKosten] = useState(
    String(initialIndirecteKostenPerMaand),
  );
  const [werkbareUren, setWerkbareUren] = useState(
    String(initialWerkbareUrenPerMaand),
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/bonus/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: parseInt(year, 10),
          werkgeverslastenPct: parseFloat(werkgeverslasten),
          indirecteKostenPerMaand: parseFloat(indirecteKosten),
          werkbareUrenPerMaand: parseInt(werkbareUren, 10),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Opslaan mislukt");
        return;
      }
      toast.success("Config opgeslagen");
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
      className="space-y-4 rounded-xl border p-5"
      style={{
        borderColor: "var(--border-subtle)",
        backgroundColor: "var(--surface-card)",
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="mb-1 block text-sm font-medium"
            style={{ color: "var(--fg-primary)" }}
          >
            Jaar
          </label>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="2020"
            max="2100"
            required
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium"
            style={{ color: "var(--fg-primary)" }}
          >
            Werkgeverslasten (%)
          </label>
          <Input
            type="number"
            step="0.01"
            value={werkgeverslasten}
            onChange={(e) => setWerkgeverslasten(e.target.value)}
            min="0"
            max="100"
            required
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium"
            style={{ color: "var(--fg-primary)" }}
          >
            Indirecte kosten / maand (€)
          </label>
          <Input
            type="number"
            step="0.01"
            value={indirecteKosten}
            onChange={(e) => setIndirecteKosten(e.target.value)}
            min="0"
            required
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm font-medium"
            style={{ color: "var(--fg-primary)" }}
          >
            Werkbare uren / maand
          </label>
          <Input
            type="number"
            value={werkbareUren}
            onChange={(e) => setWerkbareUren(e.target.value)}
            min="1"
            max="300"
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Opslaan…" : "Config opslaan"}
      </Button>
    </form>
  );
}
