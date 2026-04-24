"use client";

import { Car, Train, X, MapPin } from "lucide-react";
import { FieldWrap } from "../components/field-wrap";
import { AddressInput } from "@/components/address-input/address-input";
import type { CreateEmployeeFormValues, CompensationType } from "../types";

interface StepVergoedingProps {
  form: CreateEmployeeFormValues;
  update: (patch: Partial<CreateEmployeeFormValues>) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouch: (key: string) => void;
}

const COMP_OPTIONS: {
  v: CompensationType;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
  {
    v: "auto",
    label: "Auto",
    icon: <Car size={16} />,
    desc: "Km-tarief bij zakelijk rijden",
  },
  {
    v: "ov",
    label: "OV",
    icon: <Train size={16} />,
    desc: "Openbaar vervoer op declaratie",
  },
  {
    v: "none",
    label: "Geen",
    icon: <X size={16} />,
    desc: "Geen reiskostenvergoeding",
  },
];

export function StepVergoeding({
  form,
  update,
  errors,
  touched,
  setTouch,
}: StepVergoedingProps) {
  return (
    <div className="space-y-6">
      {/* Compensation type picker */}
      <div>
        <div
          className="mb-2.5 text-[11px] font-medium uppercase tracking-wider"
          style={{ color: "var(--text-tertiary)" }}
        >
          Reisvergoeding
        </div>
        <div className="grid grid-cols-3 gap-2">
          {COMP_OPTIONS.map((c) => {
            const selected = form.compensationType === c.v;
            return (
              <button
                key={c.v}
                type="button"
                onClick={() => update({ compensationType: c.v })}
                className="flex flex-col items-start gap-2 rounded-xl p-3.5 text-left transition-all"
                style={{
                  background: selected
                    ? "rgba(123, 92, 255, 0.08)"
                    : "var(--surface-base)",
                  border: `1.5px solid ${selected ? "var(--aurora-violet)" : "var(--border-subtle)"}`,
                  boxShadow: selected
                    ? "0 0 0 4px rgba(123, 92, 255, 0.10)"
                    : "none",
                }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{
                    background: selected
                      ? "var(--aurora-violet)"
                      : "var(--surface-deep)",
                    color: selected ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  {c.icon}
                </div>
                <div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {c.label}
                  </div>
                  <div
                    className="text-[11px] leading-snug"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {c.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {touched.compensationType && errors.compensationType && (
          <p className="mt-1 text-[11px]" style={{ color: "var(--aurora-rose)" }}>
            {errors.compensationType}
          </p>
        )}
      </div>

      {/* Km rate — only visible for auto */}
      {form.compensationType === "auto" && (
        <FieldWrap label="Km-tarief" htmlFor="emp-kmRate" hint="Standaard is 23 cent. Pas aan indien nodig.">
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              €
            </span>
            <input
              id="emp-kmRate"
              type="number"
              step="0.01"
              min={0}
              value={(form.kmRateCents / 100).toFixed(2)}
              onChange={(e) =>
                update({ kmRateCents: Math.round(Number(e.target.value) * 100) })
              }
              className="w-24 bg-transparent py-2 font-mono text-[15px] outline-none"
              style={{ color: "var(--text-primary)" }}
            />
            <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              per km
            </span>
          </div>
        </FieldWrap>
      )}

      {/* Address — use AddressInput, with manual label + error */}
      <div>
        <div
          className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider"
          style={{ color: "var(--text-tertiary)" }}
        >
          <MapPin size={11} /> Woonadres
        </div>
        <p className="mb-2 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
          Startpunt voor km-declaraties.
        </p>
        <AddressInput
          value={form.address}
          onChange={(addr) => {
            update({ address: addr });
            setTouch("address");
          }}
        />
        {touched.address && errors.address && (
          <p className="mt-1 text-[11px]" style={{ color: "var(--aurora-rose)" }}>
            {errors.address}
          </p>
        )}
      </div>

      {/* Emergency contact */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
        <FieldWrap
          label="Noodcontact — naam"
          htmlFor="emp-emergencyName"
          error={touched.emergencyName ? errors.emergencyName : null}
        >
          <input
            id="emp-emergencyName"
            type="text"
            value={form.emergencyName}
            onChange={(e) => update({ emergencyName: e.target.value })}
            onBlur={() => setTouch("emergencyName")}
            placeholder="Partner, ouder, vriend(in)…"
            className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
            style={{ color: "var(--text-primary)" }}
          />
        </FieldWrap>
        <FieldWrap label="Noodcontact — telefoon" htmlFor="emp-emergencyPhone">
          <input
            id="emp-emergencyPhone"
            type="tel"
            value={form.emergencyPhone}
            onChange={(e) => update({ emergencyPhone: e.target.value })}
            placeholder="+31 6 …"
            className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
            style={{ color: "var(--text-primary)" }}
          />
        </FieldWrap>
      </div>

      <FieldWrap label="Admin-notitie" htmlFor="emp-notes" hint="Intern. Alleen zichtbaar voor admins.">
        <textarea
          id="emp-notes"
          rows={3}
          value={form.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Bijv. 'Start met onboarding-buddy Sanne'"
          className="w-full resize-none bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--text-primary)" }}
        />
      </FieldWrap>
    </div>
  );
}
