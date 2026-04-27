"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Employee {
  id: string;
  fullName: string;
}

interface OverperformanceFormProps {
  employees: Employee[];
}

export function OverperformanceForm({ employees }: OverperformanceFormProps) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState("");
  const [amountEur, setAmountEur] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId || !description || !amountEur) {
      toast.error("Vul alle velden in");
      return;
    }
    const amountCents = Math.round(parseFloat(amountEur) * 100);
    if (Number.isNaN(amountCents)) {
      toast.error("Bedrag is ongeldig");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/bonus/overperformance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          amountCents,
          description,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Toevoegen mislukt");
        return;
      }
      toast.success("Adjustment toegevoegd");
      setAmountEur("");
      setDescription("");
      setEmployeeId("");
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
      <div>
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--fg-primary)" }}
        >
          Medewerker
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
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.fullName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--fg-primary)" }}
        >
          Bedrag (€) — negatief mag voor correcties
        </label>
        <Input
          type="number"
          step="0.01"
          value={amountEur}
          onChange={(e) => setAmountEur(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--fg-primary)" }}
        >
          Toelichting
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Reden voor over-performance / correctie"
          required
        />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Toevoegen…" : "Adjustment toevoegen"}
      </Button>
    </form>
  );
}
