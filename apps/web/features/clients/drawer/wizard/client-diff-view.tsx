"use client";

import type { CreateClientFormValues } from "./types";

interface ChangeRow {
  label: string;
  before: string;
  after: string;
}

function fmt(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return value;
}

function diffRows(
  initial: CreateClientFormValues,
  current: CreateClientFormValues,
): ChangeRow[] {
  const out: ChangeRow[] = [];
  if (initial.name !== current.name) {
    out.push({ label: "Bedrijfsnaam", before: fmt(initial.name), after: fmt(current.name) });
  }
  if (initial.kvk !== current.kvk) {
    out.push({ label: "KvK", before: fmt(initial.kvk), after: fmt(current.kvk) });
  }
  if (initial.contactName !== current.contactName) {
    out.push({
      label: "Contactpersoon",
      before: fmt(initial.contactName),
      after: fmt(current.contactName),
    });
  }
  if (initial.contactEmail !== current.contactEmail) {
    out.push({
      label: "Contact-e-mail",
      before: fmt(initial.contactEmail),
      after: fmt(current.contactEmail),
    });
  }
  if (initial.contactPhone !== current.contactPhone) {
    out.push({
      label: "Contact-telefoon",
      before: fmt(initial.contactPhone),
      after: fmt(current.contactPhone),
    });
  }
  if (
    JSON.stringify(initial.address) !== JSON.stringify(current.address)
  ) {
    out.push({
      label: "Adres",
      before: fmt(initial.address?.fullDisplay),
      after: fmt(current.address?.fullDisplay),
    });
  }
  return out;
}

export function ClientDiffView({
  initial,
  current,
}: {
  initial: CreateClientFormValues;
  current: CreateClientFormValues;
}) {
  const rows = diffRows(initial, current);

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
            style={{ borderColor: "var(--border-subtle)", color: "var(--fg-tertiary)" }}
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
