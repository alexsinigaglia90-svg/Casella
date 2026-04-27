"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EXPENSE_CATEGORIES, type ExpenseCategoryKey } from "@/lib/expenses/types";
import { ReceiptUpload } from "./receipt-upload";

interface Project {
  id: string;
  name: string;
}

interface ExpenseFormProps {
  projects: Project[];
}

const CUSTOM_FIELD_LABELS: Record<string, string> = {
  fromTo: "Van – Naar",
  personCount: "Aantal personen",
  clientName: "Klantnaam",
  eventName: "Naam evenement",
  description: "Omschrijving",
  toolName: "Tool/software",
  subscriptionPeriod: "Abonnementsperiode",
  provider: "Provider",
  giftDescription: "Omschrijving cadeau",
  extendedDescription: "Toelichting",
};

function DynamicCategoryFields({
  category,
  payload,
  onChange,
}: {
  category: ExpenseCategoryKey;
  payload: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const config = EXPENSE_CATEGORIES.find((c) => c.key === category);
  if (!config) return null;

  return (
    <div className="space-y-3">
      {config.customFields.map((field) => (
        <div key={field}>
          <label
            className="mb-1 block text-sm font-medium"
            style={{ color: "var(--fg-primary)" }}
          >
            {CUSTOM_FIELD_LABELS[field] ?? field}
          </label>
          <Input
            value={payload[field] ?? ""}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder={CUSTOM_FIELD_LABELS[field] ?? field}
          />
        </div>
      ))}
    </div>
  );
}

export function ExpenseForm({ projects }: ExpenseFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState<ExpenseCategoryKey>("travel");
  const [projectId, setProjectId] = useState<string>("__intern__");
  const [amountEur, setAmountEur] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [receiptPath, setReceiptPath] = useState("");
  const [categoryPayload, setCategoryPayload] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function handlePayloadChange(key: string, value: string) {
    setCategoryPayload((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!receiptPath) {
      toast.error("Voeg een bonnetje toe");
      return;
    }
    if (!amountEur || Number.isNaN(parseFloat(amountEur))) {
      toast.error("Vul een geldig bedrag in");
      return;
    }
    const amountCents = Math.round(parseFloat(amountEur) * 100);
    if (amountCents < 1) {
      toast.error("Bedrag moet minimaal € 0,01 zijn");
      return;
    }

    const isInternal = projectId === "__intern__";
    const resolvedProjectId = isInternal ? null : projectId;

    setSubmitting(true);
    try {
      const res = await fetch("/api/declaraties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          projectId: resolvedProjectId,
          isInternal,
          amountCents,
          date,
          description,
          receiptStoragePath: receiptPath,
          categoryPayload: Object.keys(categoryPayload).length > 0 ? categoryPayload : undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Indienen mislukt");
        return;
      }
      toast.success("Declaratie ingediend");
      router.push("/declaraties");
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
      <div>
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--fg-primary)" }}
        >
          Categorie
        </label>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as ExpenseCategoryKey);
            setCategoryPayload({});
          }}
          className="w-full rounded-md border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--border-subtle)",
            backgroundColor: "var(--surface-base)",
            color: "var(--fg-primary)",
          }}
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--fg-primary)" }}
        >
          Project / Intern
        </label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--border-subtle)",
            backgroundColor: "var(--surface-base)",
            color: "var(--fg-primary)",
          }}
        >
          <option value="__intern__">Intern Ascentra</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--fg-primary)" }}
        >
          Bedrag (€)
        </label>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          value={amountEur}
          onChange={(e) => setAmountEur(e.target.value)}
          placeholder="0,00"
          required
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--fg-primary)" }}
        >
          Datum
        </label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--fg-primary)" }}
        >
          Omschrijving
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Korte toelichting op de declaratie"
          rows={3}
          required
        />
      </div>

      <DynamicCategoryFields
        category={category}
        payload={categoryPayload}
        onChange={handlePayloadChange}
      />

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--fg-primary)" }}
        >
          Bonnetje / bewijs
        </label>
        <ReceiptUpload onPathChange={setReceiptPath} />
      </div>

      <Button type="submit" disabled={submitting || !receiptPath}>
        {submitting ? "Indienen…" : "Declaratie indienen"}
      </Button>
    </form>
  );
}
