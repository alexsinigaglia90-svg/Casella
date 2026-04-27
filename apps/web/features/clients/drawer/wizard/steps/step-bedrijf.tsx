"use client";

import { Building2, Hash, Mail, Phone, User } from "lucide-react";

import type { CreateClientFormValues } from "../types";

import { FieldWrap } from "@/features/employees/drawer/wizard/components/field-wrap";

interface StepBedrijfProps {
  form: CreateClientFormValues;
  update: (patch: Partial<CreateClientFormValues>) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouch: (key: string) => void;
}

export function StepBedrijf({
  form,
  update,
  errors,
  touched,
  setTouch,
}: StepBedrijfProps) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
      <FieldWrap
        className="md:col-span-2"
        label="Bedrijfsnaam"
        htmlFor="cli-name"
        hint="Verschijnt op projecten en facturen."
        error={touched.name ? errors.name : null}
        icon={<Building2 size={15} />}
      >
        <input
          id="cli-name"
          type="text"
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
          onBlur={() => setTouch("name")}
          placeholder="Acme Logistics B.V."
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--fg-primary)" }}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional: first field of multi-step wizard receives focus on mount for keyboard-first UX
          autoFocus
        />
      </FieldWrap>

      <FieldWrap
        label="KvK-nummer"
        htmlFor="cli-kvk"
        hint="Optioneel, maar handig voor facturatie."
        icon={<Hash size={15} />}
      >
        <input
          id="cli-kvk"
          type="text"
          value={form.kvk}
          onChange={(e) => update({ kvk: e.target.value })}
          placeholder="12345678"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--fg-primary)" }}
        />
      </FieldWrap>

      <FieldWrap
        label="Contactpersoon"
        htmlFor="cli-contactName"
        icon={<User size={15} />}
      >
        <input
          id="cli-contactName"
          type="text"
          value={form.contactName}
          onChange={(e) => update({ contactName: e.target.value })}
          placeholder="Jan de Vries"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--fg-primary)" }}
        />
      </FieldWrap>

      <FieldWrap
        label="Contact-e-mail"
        htmlFor="cli-contactEmail"
        error={touched.contactEmail ? errors.contactEmail : null}
        icon={<Mail size={15} />}
      >
        <input
          id="cli-contactEmail"
          type="email"
          value={form.contactEmail}
          onChange={(e) => update({ contactEmail: e.target.value })}
          onBlur={() => setTouch("contactEmail")}
          placeholder="contact@acme.nl"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--fg-primary)" }}
        />
      </FieldWrap>

      <FieldWrap
        label="Contact-telefoon"
        htmlFor="cli-contactPhone"
        icon={<Phone size={15} />}
      >
        <input
          id="cli-contactPhone"
          type="tel"
          value={form.contactPhone}
          onChange={(e) => update({ contactPhone: e.target.value })}
          placeholder="+31 20 123 4567"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--fg-primary)" }}
        />
      </FieldWrap>
    </div>
  );
}
