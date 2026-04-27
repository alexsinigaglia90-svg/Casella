"use client";

import { Briefcase, Calendar, CalendarCheck, User } from "lucide-react";

import type { CreateAssignmentFormValues } from "../types";

import type {
  EmployeePickerOption,
  ProjectPickerOption,
} from "@/app/(admin)/admin/toewijzingen/queries";
import { FieldWrap } from "@/features/employees/drawer/wizard/components/field-wrap";

interface StepToewijzingProps {
  form: CreateAssignmentFormValues;
  update: (patch: Partial<CreateAssignmentFormValues>) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouch: (key: string) => void;
  projects: ProjectPickerOption[];
  employees: EmployeePickerOption[];
}

function employeeLabel(e: EmployeePickerOption): string {
  const name =
    [e.firstName, e.lastName].filter(Boolean).join(" ").trim() ||
    e.displayName ||
    "Onbekend";
  return e.jobTitle ? `${name} — ${e.jobTitle}` : name;
}

export function StepToewijzing({
  form,
  update,
  errors,
  touched,
  setTouch,
  projects,
  employees,
}: StepToewijzingProps) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
      <FieldWrap
        className="md:col-span-2"
        label="Project"
        htmlFor="asg-project"
        hint="Alleen lopende of geplande projecten."
        error={touched.projectId ? errors.projectId : null}
        icon={<Briefcase size={15} />}
      >
        <select
          id="asg-project"
          value={form.projectId}
          onChange={(e) => {
            update({ projectId: e.target.value });
            setTouch("projectId");
          }}
          onBlur={() => setTouch("projectId")}
          className="w-full bg-transparent py-2 text-[15px] outline-none"
          style={{ color: "var(--fg-primary)" }}
        >
          <option value="" disabled>
            Kies project…
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.clientName}
            </option>
          ))}
        </select>
      </FieldWrap>

      <FieldWrap
        className="md:col-span-2"
        label="Medewerker"
        htmlFor="asg-employee"
        hint="Alleen actieve medewerkers."
        error={touched.employeeId ? errors.employeeId : null}
        icon={<User size={15} />}
      >
        <select
          id="asg-employee"
          value={form.employeeId}
          onChange={(e) => {
            update({ employeeId: e.target.value });
            setTouch("employeeId");
          }}
          onBlur={() => setTouch("employeeId")}
          className="w-full bg-transparent py-2 text-[15px] outline-none"
          style={{ color: "var(--fg-primary)" }}
        >
          <option value="" disabled>
            Kies medewerker…
          </option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {employeeLabel(e)}
            </option>
          ))}
        </select>
      </FieldWrap>

      <FieldWrap
        label="Startdatum"
        htmlFor="asg-startDate"
        hint="Optioneel — laat leeg als nog niet bepaald."
        error={touched.startDate ? errors.startDate : null}
        icon={<Calendar size={15} />}
      >
        <input
          id="asg-startDate"
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
        htmlFor="asg-endDate"
        hint="Optioneel — laat leeg voor lopende toewijzing."
        error={touched.endDate ? errors.endDate : null}
        icon={<CalendarCheck size={15} />}
      >
        <input
          id="asg-endDate"
          type="date"
          value={form.endDate}
          onChange={(e) => update({ endDate: e.target.value })}
          onBlur={() => setTouch("endDate")}
          className="w-full bg-transparent py-2 text-[15px] outline-none"
          style={{ color: "var(--fg-primary)" }}
        />
      </FieldWrap>
    </div>
  );
}
