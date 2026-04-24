"use client";

import { Calendar, Clock } from "lucide-react";
import { FieldWrap } from "../components/field-wrap";
import type { CreateEmployeeFormValues } from "../types";

interface StepDienstverbandProps {
  form: CreateEmployeeFormValues;
  update: (patch: Partial<CreateEmployeeFormValues>) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouch: (key: string) => void;
}

const HOUR_PRESETS = [24, 32, 36, 40];

export function StepDienstverband({
  form,
  update,
  errors,
  touched,
  setTouch,
}: StepDienstverbandProps) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
      <FieldWrap
        label="Startdatum"
        hint="Eerste werkdag bij Casella."
        error={touched.startDate ? errors.startDate : null}
        icon={<Calendar size={15} />}
        className="md:col-span-2"
      >
        <input
          type="date"
          value={form.startDate}
          onChange={(e) => update({ startDate: e.target.value })}
          onBlur={() => setTouch("startDate")}
          className="w-full bg-transparent py-2 text-[15px] outline-none"
          style={{ color: "var(--text-primary)" }}
        />
      </FieldWrap>

      <FieldWrap
        label="Contract-uren per week"
        error={touched.contractedHours ? errors.contractedHours : null}
        icon={<Clock size={15} />}
        className="md:col-span-2"
      >
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={60}
            value={form.contractedHours}
            onChange={(e) => update({ contractedHours: Number(e.target.value) })}
            onBlur={() => setTouch("contractedHours")}
            className="w-20 bg-transparent py-2 text-[15px] font-mono outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            uur/week
          </span>
          <div className="ml-auto flex gap-1">
            {HOUR_PRESETS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => update({ contractedHours: h })}
                className="rounded-md px-2.5 py-1 font-mono text-xs transition-all"
                style={{
                  background:
                    form.contractedHours === h
                      ? "var(--aurora-violet)"
                      : "var(--surface-base)",
                  color:
                    form.contractedHours === h
                      ? "#fff"
                      : "var(--text-secondary)",
                  border: `1px solid ${form.contractedHours === h ? "var(--aurora-violet)" : "var(--border-subtle)"}`,
                }}
              >
                {h}u
              </button>
            ))}
          </div>
        </div>
      </FieldWrap>

      <FieldWrap
        label="Manager"
        hint="Optioneel — wie is hun aanspreekpunt?"
        className="md:col-span-2"
      >
        {/* TODO 1.1b: replace dummy manager options with real admin-users query + send managerId UUID */}
        <select
          value={form.manager}
          onChange={(e) => update({ manager: e.target.value })}
          className="w-full cursor-pointer bg-transparent py-2 text-[15px] outline-none"
          style={{
            color: form.manager ? "var(--text-primary)" : "var(--text-tertiary)",
          }}
        >
          <option value="">— Kies iemand —</option>
          <option value="esmee">Esmée van der Velden</option>
          <option value="sanne">Sanne Bakker</option>
          <option value="maarten">Maarten de Groot</option>
        </select>
      </FieldWrap>
    </div>
  );
}
