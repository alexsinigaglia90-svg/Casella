"use client";

import { Mail, Phone, User } from "lucide-react";

import type { CreateClientFormValues } from "../types";

import { FieldWrap } from "@/features/employees/drawer/wizard/components/field-wrap";

interface StepContactProps {
  form: CreateClientFormValues;
  update: (patch: Partial<CreateClientFormValues>) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouch: (key: string) => void;
  autoFillHint: string[] | null;
  onEmailBlur?: () => void;
}

export function StepContact({
  form,
  update,
  errors,
  touched,
  setTouch,
  autoFillHint,
  onEmailBlur,
}: StepContactProps) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
      <FieldWrap
        className="md:col-span-2"
        label="Contactpersoon"
        htmlFor="cli-contactName"
        hint="Naam van de primaire contactpersoon."
        icon={<User size={15} />}
      >
        <input
          id="cli-contactName"
          type="text"
          value={form.contactName}
          onChange={(e) => update({ contactName: e.target.value })}
          onBlur={() => setTouch("contactName")}
          placeholder="Jan de Vries"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--fg-primary)" }}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional: first field of contact step
          autoFocus
        />
      </FieldWrap>

      <FieldWrap
        className="md:col-span-2"
        label="E-mailadres"
        htmlFor="cli-contactEmail"
        error={touched.contactEmail ? errors.contactEmail : null}
        hint={
          autoFillHint?.includes("name")
            ? "Bedrijfsnaam automatisch aangevuld op basis van e-maildomein"
            : undefined
        }
        icon={<Mail size={15} />}
      >
        <input
          id="cli-contactEmail"
          type="email"
          value={form.contactEmail}
          onChange={(e) => update({ contactEmail: e.target.value })}
          onBlur={() => {
            setTouch("contactEmail");
            onEmailBlur?.();
          }}
          placeholder="jan@acme.nl"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--fg-primary)" }}
        />
      </FieldWrap>

      <FieldWrap
        className="md:col-span-2"
        label="Telefoonnummer"
        htmlFor="cli-contactPhone"
        hint="Optioneel — voor directe bereikbaarheid."
        icon={<Phone size={15} />}
      >
        <input
          id="cli-contactPhone"
          type="tel"
          value={form.contactPhone}
          onChange={(e) => update({ contactPhone: e.target.value })}
          onBlur={() => setTouch("contactPhone")}
          placeholder="+31 20 123 4567"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--fg-primary)" }}
        />
      </FieldWrap>
    </div>
  );
}
