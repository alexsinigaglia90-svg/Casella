"use client";

import { Mail, Phone, Briefcase } from "lucide-react";

import { FieldWrap } from "../components/field-wrap";
import type { CreateEmployeeFormValues } from "../types";

interface StepWieProps {
  form: CreateEmployeeFormValues;
  update: (patch: Partial<CreateEmployeeFormValues>) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouch: (key: string) => void;
  onEmailBlur: () => void;
  autoFillHint: string[] | null;
}

export function StepWie({
  form,
  update,
  errors,
  touched,
  setTouch,
  onEmailBlur,
  autoFillHint,
}: StepWieProps) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
      <FieldWrap
        className="md:col-span-2"
        label="E-mailadres"
        htmlFor="emp-inviteEmail"
        hint="We sturen hier de uitnodiging naartoe."
        error={touched.inviteEmail ? errors.inviteEmail : null}
        icon={<Mail size={15} />}
      >
        <input
          id="emp-inviteEmail"
          type="email"
          value={form.inviteEmail}
          onChange={(e) => update({ inviteEmail: e.target.value })}
          onBlur={() => {
            setTouch("inviteEmail");
            onEmailBlur();
          }}
          placeholder="naam@ascentra.nl"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--fg-primary)" }}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional: first field of multi-step wizard receives focus on mount for keyboard-first UX
          autoFocus
        />
      </FieldWrap>

      <FieldWrap
        label="Voornaam"
        htmlFor="emp-firstName"
        error={touched.firstName ? errors.firstName : null}
        autoFilled={autoFillHint?.includes("firstName")}
      >
        <input
          id="emp-firstName"
          type="text"
          value={form.firstName}
          onChange={(e) => update({ firstName: e.target.value })}
          onBlur={() => setTouch("firstName")}
          placeholder="Esmée"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--fg-primary)" }}
        />
      </FieldWrap>

      <FieldWrap
        label="Achternaam"
        htmlFor="emp-lastName"
        error={touched.lastName ? errors.lastName : null}
        autoFilled={autoFillHint?.includes("lastName")}
      >
        <input
          id="emp-lastName"
          type="text"
          value={form.lastName}
          onChange={(e) => update({ lastName: e.target.value })}
          onBlur={() => setTouch("lastName")}
          placeholder="van der Velden"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--fg-primary)" }}
        />
      </FieldWrap>

      <FieldWrap
        label="Functietitel"
        htmlFor="emp-jobTitle"
        hint="Staat straks op hun profiel."
        error={touched.jobTitle ? errors.jobTitle : null}
        icon={<Briefcase size={15} />}
        className="md:col-span-2"
      >
        <input
          id="emp-jobTitle"
          type="text"
          value={form.jobTitle}
          onChange={(e) => update({ jobTitle: e.target.value })}
          onBlur={() => setTouch("jobTitle")}
          placeholder="Senior Supply Chain Consultant"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--fg-primary)" }}
        />
      </FieldWrap>

      <FieldWrap
        label="Telefoonnummer"
        htmlFor="emp-phone"
        error={touched.phone ? errors.phone : null}
        icon={<Phone size={15} />}
        className="md:col-span-2"
      >
        <input
          id="emp-phone"
          type="tel"
          value={form.phone}
          onChange={(e) => update({ phone: e.target.value })}
          onBlur={() => setTouch("phone")}
          placeholder="+31 6 1234 5678"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--fg-primary)" }}
        />
      </FieldWrap>
    </div>
  );
}
