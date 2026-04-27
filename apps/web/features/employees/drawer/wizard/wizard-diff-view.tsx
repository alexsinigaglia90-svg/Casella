"use client";

import type { CreateEmployeeFormValues } from "./types";

interface WizardDiffViewProps {
  initial: CreateEmployeeFormValues;
  current: CreateEmployeeFormValues;
}

const FIELD_LABELS: Record<keyof CreateEmployeeFormValues, string> = {
  firstName: "Voornaam",
  lastName: "Achternaam",
  inviteEmail: "E-mail",
  phone: "Telefoon",
  jobTitle: "Functie",
  startDate: "Startdatum",
  contractedHours: "Contract-uren/week",
  compensationType: "Vergoeding",
  kmRateCents: "Km-tarief (cent)",
  address: "Woonadres",
  emergencyName: "Noodcontact (naam)",
  emergencyPhone: "Noodcontact (telefoon)",
  notes: "Notities",
};

export function WizardDiffView({ initial, current }: WizardDiffViewProps) {
  const changedFields = (Object.keys(current) as (keyof CreateEmployeeFormValues)[]).filter(
    (k) => JSON.stringify(initial[k]) !== JSON.stringify(current[k]),
  );

  if (changedFields.length === 0) {
    return (
      <div
        className="rounded-xl px-5 py-6 text-sm"
        style={{
          border: "1px solid var(--border-subtle)",
          background: "var(--surface-base)",
          color: "var(--fg-tertiary)",
        }}
      >
        Geen wijzigingen om op te slaan.
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{
        border: "1px solid var(--border-subtle)",
        background: "var(--surface-base)",
      }}
    >
      <div
        className="border-b px-5 py-2.5 text-[11px] font-mono uppercase tracking-wider"
        style={{ borderColor: "var(--border-subtle)", color: "var(--fg-tertiary)" }}
      >
        {changedFields.length} wijziging{changedFields.length === 1 ? "" : "en"}
      </div>
      <ul className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
        {changedFields.map((key) => (
          <li
            key={key}
            className="grid grid-cols-[140px_1fr_auto_1fr] items-baseline gap-3 px-5 py-3 text-sm"
          >
            <span
              className="text-[11px] font-medium uppercase tracking-wider"
              style={{ color: "var(--fg-tertiary)" }}
            >
              {FIELD_LABELS[key]}
            </span>
            <span
              style={{
                color: "var(--fg-quaternary)",
                textDecoration: "line-through",
              }}
            >
              {formatValue(initial[key])}
            </span>
            <span aria-hidden style={{ color: "var(--fg-tertiary)" }}>
              →
            </span>
            <span style={{ color: "var(--fg-primary)", fontWeight: 500 }}>
              {formatValue(current[key])}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "object") {
    if ("fullDisplay" in (v as object)) {
      return (v as { fullDisplay: string }).fullDisplay;
    }
    return JSON.stringify(v);
  }
  return String(v);
}
