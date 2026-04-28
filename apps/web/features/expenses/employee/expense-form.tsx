"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ReceiptUpload } from "./receipt-upload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DOMAIN_HUES, oklchEmphasis, oklchSubtleBg } from "@/lib/design/oklch";
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategoryKey,
} from "@/lib/expenses/types";

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
            className="mb-1 block font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.08em",
              color: "var(--fg-tertiary)",
            }}
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

const SHIMMER_CSS = `
@keyframes ocrShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.exp-shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg,
    transparent 0%,
    oklch(0.92 0.06 280 / 0.4) 35%,
    oklch(0.92 0.06 145 / 0.4) 50%,
    oklch(0.92 0.06 280 / 0.4) 65%,
    transparent 100%);
  background-size: 200% 100%;
  animation: ocrShimmer 1.5s linear infinite;
  pointer-events: none;
  border-radius: inherit;
}
`;

export function ExpenseForm({ projects }: ExpenseFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState<ExpenseCategoryKey>("travel");
  const [projectId, setProjectId] = useState<string>("__intern__");
  const [amountEur, setAmountEur] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [receiptPath, setReceiptPath] = useState("");
  const [categoryPayload, setCategoryPayload] = useState<
    Record<string, string>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);

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
          categoryPayload:
            Object.keys(categoryPayload).length > 0
              ? categoryPayload
              : undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
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

  function startKmQuickAdd() {
    setCategory("travel");
    setShowFullForm(true);
  }

  return (
    <div className="space-y-6">
      <style>{SHIMMER_CSS}</style>

      {/* Drop-zone hero */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          setShowFullForm(true);
        }}
        className="relative overflow-hidden rounded-3xl text-center transition-all"
        style={{
          border: `1.5px dashed ${
            dragOver
              ? oklchEmphasis(DOMAIN_HUES.spark)
              : "var(--border-subtle)"
          }`,
          background: dragOver
            ? `linear-gradient(135deg, ${oklchSubtleBg(
                DOMAIN_HUES.spark,
              )} 0%, ${oklchSubtleBg(DOMAIN_HUES.cloud)} 100%)`
            : "var(--surface-base)",
          padding: "3rem 1.5rem",
        }}
      >
        <div
          className="mx-auto mb-4 grid size-14 place-items-center rounded-full"
          style={{
            background: oklchSubtleBg(DOMAIN_HUES.spark),
            color: oklchEmphasis(DOMAIN_HUES.spark),
            fontSize: 24,
          }}
          aria-hidden
        >
          ↥
        </div>
        <div
          className="font-display"
          style={{
            fontSize: 24,
            fontWeight: 500,
            color: "var(--fg-primary)",
          }}
        >
          Sleep een bonnetje hierheen of klik om te uploaden
        </div>
        <div
          className="mt-2"
          style={{ fontSize: 12, color: "var(--fg-tertiary)" }}
        >
          OCR-extractie volgt — voor nu vul je bedrag + datum zelf in
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setShowFullForm(true)}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white"
            style={{
              background: oklchEmphasis(DOMAIN_HUES.spark),
            }}
          >
            Bonnetje toevoegen
          </button>
          <button
            type="button"
            onClick={startKmQuickAdd}
            className="rounded-xl border px-4 py-2 text-sm font-medium"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--fg-primary)",
              background: "var(--surface-card)",
            }}
          >
            Snel km bijschrijven
          </button>
        </div>
      </div>

      {showFullForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border p-6"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--surface-card)",
          }}
        >
          <div>
            <div
              className="mb-3 font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                color: "var(--fg-tertiary)",
              }}
            >
              Detail
            </div>
            <h2
              className="font-display"
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: "var(--fg-primary)",
              }}
            >
              Vul declaratie aan
            </h2>
          </div>

          <div>
            <label
              className="mb-1 block font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--fg-tertiary)",
              }}
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
                background: "var(--surface-base)",
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
              className="mb-1 block font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--fg-tertiary)",
              }}
            >
              Project / Intern
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--surface-base)",
                color: "var(--fg-primary)",
              }}
            >
              <option value="__intern__">Intern Casella</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                className="mb-1 block font-mono uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  color: "var(--fg-tertiary)",
                }}
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
                className="mb-1 block font-mono uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  color: "var(--fg-tertiary)",
                }}
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
          </div>

          <div>
            <label
              className="mb-1 block font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--fg-tertiary)",
              }}
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
              className="mb-1 block font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                color: "var(--fg-tertiary)",
              }}
            >
              Bonnetje / bewijs
            </label>
            <ReceiptUpload onPathChange={setReceiptPath} />
          </div>

          <Button
            type="submit"
            disabled={submitting || !receiptPath}
            style={{
              background: oklchEmphasis(DOMAIN_HUES.spark),
              color: "#fff",
            }}
          >
            {submitting ? "Indienen…" : "Declaratie indienen"}
          </Button>
        </form>
      )}
    </div>
  );
}
