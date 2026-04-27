"use client";

import { PROJECT_STATUS_LABELS } from "./helpers/project-mapping";
import type { CreateProjectFormValues } from "./types";

interface ChangeRow {
  label: string;
  before: string;
  after: string;
}

interface ClientOption {
  id: string;
  name: string;
}

function fmt(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return value;
}

function clientLabel(id: string, clients: ClientOption[]): string {
  if (!id) return "—";
  return clients.find((c) => c.id === id)?.name ?? id;
}

function diffRows(
  initial: CreateProjectFormValues,
  current: CreateProjectFormValues,
  clients: ClientOption[],
): ChangeRow[] {
  const out: ChangeRow[] = [];
  if (initial.clientId !== current.clientId) {
    out.push({
      label: "Klant",
      before: clientLabel(initial.clientId, clients),
      after: clientLabel(current.clientId, clients),
    });
  }
  if (initial.name !== current.name) {
    out.push({
      label: "Naam",
      before: fmt(initial.name),
      after: fmt(current.name),
    });
  }
  if (initial.description !== current.description) {
    out.push({
      label: "Omschrijving",
      before: fmt(initial.description),
      after: fmt(current.description),
    });
  }
  if (initial.startDate !== current.startDate) {
    out.push({
      label: "Startdatum",
      before: fmt(initial.startDate),
      after: fmt(current.startDate),
    });
  }
  if (initial.endDate !== current.endDate) {
    out.push({
      label: "Einddatum",
      before: fmt(initial.endDate),
      after: fmt(current.endDate),
    });
  }
  if (initial.status !== current.status) {
    out.push({
      label: "Status",
      before: PROJECT_STATUS_LABELS[initial.status],
      after: PROJECT_STATUS_LABELS[current.status],
    });
  }
  return out;
}

export function ProjectDiffView({
  initial,
  current,
  clients,
}: {
  initial: CreateProjectFormValues;
  current: CreateProjectFormValues;
  clients: ClientOption[];
}) {
  const rows = diffRows(initial, current, clients);

  if (rows.length === 0) {
    return (
      <div
        className="rounded-xl border p-8 text-center"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-base)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
          Geen wijzigingen om op te slaan.
        </p>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            className="border-b text-[11px] uppercase tracking-wider"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--fg-tertiary)",
            }}
          >
            <th className="p-3 text-left font-medium">Veld</th>
            <th className="p-3 text-left font-medium">Was</th>
            <th className="p-3 text-left font-medium">Wordt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.label}
              className="border-b last:border-0"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <td
                className="p-3 align-top text-[11px] font-medium uppercase tracking-wider"
                style={{ color: "var(--fg-tertiary)" }}
              >
                {r.label}
              </td>
              <td className="p-3 align-top" style={{ color: "var(--fg-tertiary)" }}>
                <span style={{ textDecoration: "line-through" }}>{r.before}</span>
              </td>
              <td className="p-3 align-top" style={{ color: "var(--fg-primary)" }}>
                {r.after}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
