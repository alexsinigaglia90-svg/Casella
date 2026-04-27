"use client";

import type { CompensationType } from "@casella/types";
import { Car, Coins } from "lucide-react";

import {
  COMPENSATION_TYPE_LABELS,
  compensationLabel,
  kmRateLabel,
} from "../helpers/assignment-mapping";
import type { CreateAssignmentFormValues } from "../types";

import type {
  EmployeePickerOption,
  ProjectPickerOption,
} from "@/app/(admin)/admin/toewijzingen/queries";
import { FieldWrap } from "@/features/employees/drawer/wizard/components/field-wrap";

interface StepVergoedingProps {
  form: CreateAssignmentFormValues;
  update: (patch: Partial<CreateAssignmentFormValues>) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouch: (key: string) => void;
  projects: ProjectPickerOption[];
  employees: EmployeePickerOption[];
  onJump: (i: number) => void;
}

const COMPENSATION_OPTIONS: { value: CompensationType | ""; label: string }[] =
  [
    { value: "", label: "Volg medewerker" },
    { value: "auto", label: COMPENSATION_TYPE_LABELS.auto },
    { value: "ov", label: COMPENSATION_TYPE_LABELS.ov },
    { value: "none", label: COMPENSATION_TYPE_LABELS.none },
  ];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span
        className="text-[11px] font-medium uppercase tracking-wider"
        style={{ color: "var(--fg-tertiary)" }}
      >
        {label}
      </span>
      <span
        className="text-right text-sm"
        style={{ color: "var(--fg-primary)" }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function employeeName(e: EmployeePickerOption): string {
  return (
    [e.firstName, e.lastName].filter(Boolean).join(" ").trim() ||
    e.displayName ||
    "Onbekend"
  );
}

export function StepVergoeding({
  form,
  update,
  errors,
  touched,
  setTouch,
  projects,
  employees,
  onJump,
}: StepVergoedingProps) {
  const project = projects.find((p) => p.id === form.projectId);
  const employee = employees.find((e) => e.id === form.employeeId);

  const compensationDisplay = compensationLabel(
    form.compensationType === "" ? null : form.compensationType,
  );
  const kmRateDisplay = kmRateLabel(
    form.kmRateCents === "" ? null : Number(form.kmRateCents),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
        <FieldWrap
          label="Vergoedingstype"
          htmlFor="asg-compensationType"
          hint="Override — laat op 'Volg medewerker' om de default te gebruiken."
          icon={<Car size={15} />}
        >
          <select
            id="asg-compensationType"
            value={form.compensationType}
            onChange={(e) =>
              update({
                compensationType: e.target.value as CompensationType | "",
              })
            }
            className="w-full bg-transparent py-2 text-[15px] outline-none"
            style={{ color: "var(--fg-primary)" }}
          >
            {COMPENSATION_OPTIONS.map((o) => (
              <option key={o.value || "default"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FieldWrap>

        <FieldWrap
          label="Km-tarief (cents)"
          htmlFor="asg-kmRateCents"
          hint="Optioneel — leeg = standaard van medewerker."
          error={touched.kmRateCents ? errors.kmRateCents : null}
          icon={<Coins size={15} />}
        >
          <input
            id="asg-kmRateCents"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={form.kmRateCents}
            onChange={(e) => update({ kmRateCents: e.target.value })}
            onBlur={() => setTouch("kmRateCents")}
            placeholder="Standaard medewerker"
            className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
            style={{ color: "var(--fg-primary)" }}
          />
        </FieldWrap>
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
            Toewijzing
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
        <Row
          label="Project"
          value={
            project ? `${project.name} — ${project.clientName}` : ""
          }
        />
        <Row label="Medewerker" value={employee ? employeeName(employee) : ""} />
        <Row label="Startdatum" value={form.startDate} />
        <Row label="Einddatum" value={form.endDate} />
      </div>

      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-base)",
        }}
      >
        <div
          className="mb-3 text-[11px] font-medium uppercase tracking-wider"
          style={{ color: "var(--fg-tertiary)" }}
        >
          Vergoeding
        </div>
        <Row label="Type" value={compensationDisplay} />
        <Row label="Km-tarief" value={kmRateDisplay} />
      </div>
    </div>
  );
}
