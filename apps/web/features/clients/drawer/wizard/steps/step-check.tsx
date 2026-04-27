"use client";

import type { CreateClientFormValues } from "../types";

interface StepCheckProps {
  form: CreateClientFormValues;
  onJump: (i: number) => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span
        className="text-[11px] font-medium uppercase tracking-wider"
        style={{ color: "var(--fg-tertiary)" }}
      >
        {label}
      </span>
      <span className="text-sm" style={{ color: "var(--fg-primary)" }}>
        {value || "—"}
      </span>
    </div>
  );
}

export function StepCheck({ form, onJump }: StepCheckProps) {
  return (
    <div className="space-y-6">
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-base)",
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h4
            className="text-[11px] font-medium uppercase tracking-wider"
            style={{ color: "var(--fg-tertiary)" }}
          >
            Bedrijf
          </h4>
          <button
            type="button"
            onClick={() => onJump(0)}
            className="text-[11px] hover:underline"
            style={{ color: "var(--aurora-violet)" }}
          >
            Bewerken
          </button>
        </div>
        <Row label="Naam" value={form.name} />
        <Row label="KvK" value={form.kvk} />
        <Row label="Contact" value={form.contactName} />
        <Row label="E-mail" value={form.contactEmail} />
        <Row label="Telefoon" value={form.contactPhone} />
      </div>

      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-base)",
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h4
            className="text-[11px] font-medium uppercase tracking-wider"
            style={{ color: "var(--fg-tertiary)" }}
          >
            Adres
          </h4>
          <button
            type="button"
            onClick={() => onJump(1)}
            className="text-[11px] hover:underline"
            style={{ color: "var(--aurora-violet)" }}
          >
            Bewerken
          </button>
        </div>
        <Row label="Adres" value={form.address?.fullDisplay ?? ""} />
      </div>
    </div>
  );
}
