"use client";

import { Briefcase, FileText, Building2 } from "lucide-react";

import type { CreateProjectFormValues } from "../types";

import { FieldWrap } from "@/features/employees/drawer/wizard/components/field-wrap";

interface ClientOption {
  id: string;
  name: string;
}

interface StepBasisProps {
  form: CreateProjectFormValues;
  update: (patch: Partial<CreateProjectFormValues>) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouch: (key: string) => void;
  clients: ClientOption[];
}

export function StepBasis({
  form,
  update,
  errors,
  touched,
  setTouch,
  clients,
}: StepBasisProps) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-5">
      <FieldWrap
        label="Klant"
        htmlFor="prj-client"
        hint="Bij welke klant hoort dit project?"
        error={touched.clientId ? errors.clientId : null}
        icon={<Building2 size={15} />}
      >
        <select
          id="prj-client"
          value={form.clientId}
          onChange={(e) => {
            update({ clientId: e.target.value });
            setTouch("clientId");
          }}
          onBlur={() => setTouch("clientId")}
          className="w-full bg-transparent py-2 text-[15px] outline-none"
          style={{ color: "var(--fg-primary)" }}
        >
          <option value="" disabled>
            Kies klant…
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FieldWrap>

      <FieldWrap
        label="Projectnaam"
        htmlFor="prj-name"
        hint="Verschijnt in urenregistratie en rapportages."
        error={touched.name ? errors.name : null}
        icon={<Briefcase size={15} />}
      >
        <input
          id="prj-name"
          type="text"
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
          onBlur={() => setTouch("name")}
          placeholder="Renovatie HQ — fase 2"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--fg-primary)" }}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional: keyboard-first wizard UX
          autoFocus
        />
      </FieldWrap>

      <FieldWrap
        label="Omschrijving"
        htmlFor="prj-description"
        hint="Optioneel — context voor het team."
        icon={<FileText size={15} />}
      >
        <textarea
          id="prj-description"
          value={form.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Korte beschrijving, scope of bijzonderheden…"
          rows={4}
          className="w-full resize-none bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--fg-primary)" }}
        />
      </FieldWrap>
    </div>
  );
}
