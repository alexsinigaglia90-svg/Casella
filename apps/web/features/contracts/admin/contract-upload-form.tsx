"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Employee {
  id: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface ContractUploadFormProps {
  employees: Employee[];
}

export function ContractUploadForm({ employees }: ContractUploadFormProps) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  // Stub: in Fase 2 replaced by Supabase Storage upload
  // See docs/casella-deferred-work.md CONTRACTS-PDF-UPLOAD
  const [pdfStoragePath, setPdfStoragePath] = useState("");
  const [brutoSalaris, setBrutoSalaris] = useState("");
  const [vakantietoeslag, setVakantietoeslag] = useState("8");
  const [baselineTarief, setBaselineTarief] = useState("75");
  const [bonusBelowPct, setBonusBelowPct] = useState("10");
  const [bonusAbovePct, setBonusAbovePct] = useState("15");
  const [maxOverperf, setMaxOverperf] = useState("20");
  const [autoStelpost, setAutoStelpost] = useState(false);
  const [autoStelpostBedrag, setAutoStelpostBedrag] = useState("1000");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId || !jobTitle || !pdfStoragePath) {
      toast.error("Vul alle verplichte velden in");
      return;
    }

    setSubmitting(true);
    try {
      const brutoSalarisMaandCents = brutoSalaris
        ? Math.round(parseFloat(brutoSalaris) * 100)
        : null;

      const res = await fetch("/api/admin/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          startDate,
          endDate: endDate || null,
          jobTitle,
          pdfStoragePath,
          brutoSalarisMaandCents,
          vakantietoeslagPct: vakantietoeslag ? parseFloat(vakantietoeslag) : null,
          baselineTariefPerUur: baselineTarief ? parseFloat(baselineTarief) : null,
          bonusPctBelowBaseline: bonusBelowPct ? parseFloat(bonusBelowPct) : null,
          bonusPctAboveBaseline: bonusAbovePct ? parseFloat(bonusAbovePct) : null,
          maxOverperformancePct: maxOverperf ? parseFloat(maxOverperf) : null,
          autoStelpostActief: autoStelpost,
          autoStelpostBedragMaand: autoStelpost && autoStelpostBedrag
            ? parseFloat(autoStelpostBedrag)
            : null,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Upload mislukt");
        return;
      }
      toast.success("Contract geüpload en medewerker geïnformeerd");
      router.refresh();
      // Reset form
      setEmployeeId("");
      setJobTitle("");
      setPdfStoragePath("");
      setBrutoSalaris("");
      setEndDate("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border p-6 glass-card"
      style={{
        borderColor: "var(--border-subtle)",
        backgroundColor: "var(--surface-card)",
      }}
    >
      <div
        className="rounded-lg border px-3 py-2 text-sm"
        style={{
          borderColor: "var(--aurora-violet)",
          backgroundColor: "rgba(139, 92, 246, 0.08)",
          color: "var(--fg-secondary)",
        }}
      >
        PDF-upload werkt na Fase 2 deploy (Supabase Storage). Vul nu een stub-pad in of een
        bestandsnaam als tijdelijke referentie. Zie CONTRACTS-PDF-UPLOAD in deferred-work.
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
          Medewerker *
        </label>
        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--border-subtle)",
            backgroundColor: "var(--surface-base)",
            color: "var(--fg-primary)",
          }}
        >
          <option value="">Selecteer medewerker</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.displayName ?? (emp.firstName ? `${emp.firstName} ${emp.lastName ?? ""}`.trim() : emp.id)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
            Startdatum *
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
            Einddatum (leeg = onbepaald)
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
          Functietitel *
        </label>
        <Input
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="bijv. Senior Developer"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
          PDF-pad / stub-pad *
        </label>
        <Input
          value={pdfStoragePath}
          onChange={(e) => setPdfStoragePath(e.target.value)}
          placeholder="stub/contracts/contract-2026-01-01.pdf"
          required
        />
      </div>

      <hr style={{ borderColor: "var(--border-subtle)" }} />
      <p className="text-sm font-medium" style={{ color: "var(--fg-tertiary)" }}>
        Salaris &amp; bonus-formule (optioneel)
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
            Bruto salaris / maand (€)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={brutoSalaris}
            onChange={(e) => setBrutoSalaris(e.target.value)}
            placeholder="5000.00"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
            Vakantietoeslag (%)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={vakantietoeslag}
            onChange={(e) => setVakantietoeslag(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
            Baseline tarief per uur (€)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={baselineTarief}
            onChange={(e) => setBaselineTarief(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
            Bonus below baseline (%)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={bonusBelowPct}
            onChange={(e) => setBonusBelowPct(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
            Bonus above baseline (%)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={bonusAbovePct}
            onChange={(e) => setBonusAbovePct(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
            Max overperformance (%)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={maxOverperf}
            onChange={(e) => setMaxOverperf(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="autoStelpost"
          checked={autoStelpost}
          onChange={(e) => setAutoStelpost(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="autoStelpost" className="text-sm" style={{ color: "var(--fg-primary)" }}>
          Auto-stelpost actief
        </label>
        {autoStelpost && (
          <Input
            type="number"
            step="0.01"
            min="0"
            value={autoStelpostBedrag}
            onChange={(e) => setAutoStelpostBedrag(e.target.value)}
            placeholder="1000.00"
            className="ml-auto w-40"
          />
        )}
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Uploaden…" : "Contract opslaan"}
      </Button>
    </form>
  );
}
