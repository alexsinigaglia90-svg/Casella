"use client";

import type { CompensationType } from "@casella/types";

import {
  compensationLabel,
  kmRateLabel,
} from "./helpers/assignment-mapping";
import type { CreateAssignmentFormValues } from "./types";

import type {
  EmployeePickerOption,
  ProjectPickerOption,
} from "@/app/(admin)/admin/toewijzingen/queries";

interface ChangeRow {
  label: string;
  before: string;
  after: string;
}

function fmt(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return value;
}

function projectLabel(id: string, projects: ProjectPickerOption[]): string {
  if (!id) return "—";
  const p = projects.find((x) => x.id === id);
  return p ? `${p.name} — ${p.clientName}` : id;
}

function employeeLabel(id: string, employees: EmployeePickerOption[]): string {
  if (!id) return "—";
  const e = employees.find((x) => x.id === id);
  if (!e) return id;
  return (
    [e.firstName, e.lastName].filter(Boolean).join(" ").trim() ||
    e.displayName ||
    "Onbekend"
  );
}

function compensationDisplay(value: CompensationType | ""): string {
  return compensationLabel(value === "" ? null : value);
}

function kmRateDisplay(value: string): string {
  return kmRateLabel(value === "" ? null : Number(value));
}

function diffRows(
  initial: CreateAssignmentFormValues,
  current: CreateAssignmentFormValues,
  projects: ProjectPickerOption[],
  employees: EmployeePickerOption[],
): ChangeRow[] {
  const out: ChangeRow[] = [];

  if (initial.projectId !== current.projectId) {
    out.push({
      label: "Project",
      before: projectLabel(initial.projectId, projects),
      after: projectLabel(current.projectId, projects),
    });
  }
  if (initial.employeeId !== current.employeeId) {
    out.push({
      label: "Medewerker",
      before: employeeLabel(initial.employeeId, employees),
      after: employeeLabel(current.employeeId, employees),
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
  if (initial.compensationType !== current.compensationType) {
    out.push({
      label: "Vergoedingstype",
      before: compensationDisplay(initial.compensationType),
      after: compensationDisplay(current.compensationType),
    });
  }
  if (initial.kmRateCents !== current.kmRateCents) {
    out.push({
      label: "Km-tarief",
      before: kmRateDisplay(initial.kmRateCents),
      after: kmRateDisplay(current.kmRateCents),
    });
  }
  return out;
}

export function AssignmentDiffView({
  initial,
  current,
  projects,
  employees,
}: {
  initial: CreateAssignmentFormValues;
  current: CreateAssignmentFormValues;
  projects: ProjectPickerOption[];
  employees: EmployeePickerOption[];
}) {
  const rows = diffRows(initial, current, projects, employees);

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
