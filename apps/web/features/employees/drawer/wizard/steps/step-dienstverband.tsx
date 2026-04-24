"use client";

import { Calendar, Clock } from "lucide-react";
import { FieldWrap } from "../components/field-wrap";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
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
        htmlFor="emp-startDate"
        hint="Eerste werkdag bij Casella."
        error={touched.startDate ? errors.startDate : null}
        icon={<Calendar size={15} />}
        className="md:col-span-2"
      >
        <input
          id="emp-startDate"
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
        htmlFor="emp-contractedHours"
        error={touched.contractedHours ? errors.contractedHours : null}
        icon={<Clock size={15} />}
        className="md:col-span-2"
      >
        <div className="flex items-center gap-3">
          <input
            id="emp-contractedHours"
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
        htmlFor="emp-manager"
        className="md:col-span-2"
      >
        {/* TODO 1.1b: replace dummy manager options with real admin-users query + send managerId UUID */}
        <Select value={form.manager} onValueChange={(v) => update({ manager: v })}>
          <SelectTrigger
            id="emp-manager"
            className="w-full bg-transparent border-0 outline-none focus:ring-0 px-0"
            style={{ color: form.manager ? "var(--text-primary)" : "var(--text-tertiary)" }}
          >
            <SelectValue placeholder="— Kies iemand —" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="esmee">Esmée van der Velden</SelectItem>
            <SelectItem value="sanne">Sanne Bakker</SelectItem>
            <SelectItem value="maarten">Maarten de Groot</SelectItem>
          </SelectContent>
        </Select>
      </FieldWrap>
    </div>
  );
}
