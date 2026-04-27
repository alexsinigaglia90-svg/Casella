"use client";

import { PROJECT_STATUS_LABELS } from "../helpers/project-mapping";
import type { CreateProjectFormValues } from "../types";

interface ClientOption {
  id: string;
  name: string;
}

interface StepCheckProps {
  form: CreateProjectFormValues;
  onJump: (i: number) => void;
  clients: ClientOption[];
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

export function StepCheck({ form, onJump, clients }: StepCheckProps) {
  const clientName =
    clients.find((c) => c.id === form.clientId)?.name ?? "—";
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
            Basis
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
        <Row label="Klant" value={clientName} />
        <Row label="Naam" value={form.name} />
        <Row label="Omschrijving" value={form.description} />
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
            Periode
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
        <Row label="Startdatum" value={form.startDate} />
        <Row label="Einddatum" value={form.endDate} />
        <Row label="Status" value={PROJECT_STATUS_LABELS[form.status]} />
      </div>
    </div>
  );
}
