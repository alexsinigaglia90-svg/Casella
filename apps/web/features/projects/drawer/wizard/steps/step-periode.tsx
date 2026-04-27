"use client";

import type { ProjectStatus } from "@casella/types";
import { Calendar, CalendarCheck, Activity } from "lucide-react";

import type { CreateProjectFormValues } from "../types";

import { FieldWrap } from "@/features/employees/drawer/wizard/components/field-wrap";

interface StepPeriodeProps {
  form: CreateProjectFormValues;
  update: (patch: Partial<CreateProjectFormValues>) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouch: (key: string) => void;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "planned", label: "Gepland" },
  { value: "active", label: "Actief" },
  { value: "completed", label: "Voltooid" },
  { value: "cancelled", label: "Geannuleerd" },
];

export function StepPeriode({
  form,
  update,
  errors,
  touched,
  setTouch,
}: StepPeriodeProps) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
      <FieldWrap
        label="Startdatum"
        htmlFor="prj-startDate"
        hint="Optioneel — laat leeg als nog niet bepaald."
        error={touched.startDate ? errors.startDate : null}
        icon={<Calendar size={15} />}
      >
        <input
          id="prj-startDate"
          type="date"
          value={form.startDate}
          onChange={(e) => update({ startDate: e.target.value })}
          onBlur={() => setTouch("startDate")}
          className="w-full bg-transparent py-2 text-[15px] outline-none"
          style={{ color: "var(--fg-primary)" }}
        />
      </FieldWrap>

      <FieldWrap
        label="Einddatum"
        htmlFor="prj-endDate"
        hint="Optioneel — laat leeg voor lopend project."
        error={touched.endDate ? errors.endDate : null}
        icon={<CalendarCheck size={15} />}
      >
        <input
          id="prj-endDate"
          type="date"
          value={form.endDate}
          onChange={(e) => update({ endDate: e.target.value })}
          onBlur={() => setTouch("endDate")}
          className="w-full bg-transparent py-2 text-[15px] outline-none"
          style={{ color: "var(--fg-primary)" }}
        />
      </FieldWrap>

      <FieldWrap
        className="md:col-span-2"
        label="Status"
        htmlFor="prj-status"
        hint="Bepaalt of medewerkers uren kunnen schrijven."
        icon={<Activity size={15} />}
      >
        <select
          id="prj-status"
          value={form.status}
          onChange={(e) =>
            update({ status: e.target.value as ProjectStatus })
          }
          className="w-full bg-transparent py-2 text-[15px] outline-none"
          style={{ color: "var(--fg-primary)" }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FieldWrap>
    </div>
  );
}
