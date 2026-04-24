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
        hint="We sturen hier de uitnodiging naartoe."
        error={touched.inviteEmail ? errors.inviteEmail : null}
        icon={<Mail size={15} />}
      >
        <input
          type="email"
          value={form.inviteEmail}
          onChange={(e) => update({ inviteEmail: e.target.value })}
          onBlur={() => {
            setTouch("inviteEmail");
            onEmailBlur();
          }}
          placeholder="naam@ascentra.nl"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--text-primary)" }}
          autoFocus
        />
      </FieldWrap>

      <FieldWrap
        label="Voornaam"
        error={touched.firstName ? errors.firstName : null}
        autoFilled={autoFillHint?.includes("firstName")}
      >
        <input
          type="text"
          value={form.firstName}
          onChange={(e) => update({ firstName: e.target.value })}
          onBlur={() => setTouch("firstName")}
          placeholder="Esmée"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--text-primary)" }}
        />
      </FieldWrap>

      <FieldWrap
        label="Achternaam"
        error={touched.lastName ? errors.lastName : null}
        autoFilled={autoFillHint?.includes("lastName")}
      >
        <input
          type="text"
          value={form.lastName}
          onChange={(e) => update({ lastName: e.target.value })}
          onBlur={() => setTouch("lastName")}
          placeholder="van der Velden"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--text-primary)" }}
        />
      </FieldWrap>

      <FieldWrap
        label="Functietitel"
        hint="Staat straks op hun profiel."
        error={touched.jobTitle ? errors.jobTitle : null}
        icon={<Briefcase size={15} />}
        className="md:col-span-2"
      >
        <input
          type="text"
          value={form.jobTitle}
          onChange={(e) => update({ jobTitle: e.target.value })}
          onBlur={() => setTouch("jobTitle")}
          placeholder="Senior Supply Chain Consultant"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--text-primary)" }}
        />
      </FieldWrap>

      <FieldWrap
        label="Telefoonnummer"
        error={touched.phone ? errors.phone : null}
        icon={<Phone size={15} />}
        className="md:col-span-2"
      >
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => update({ phone: e.target.value })}
          onBlur={() => setTouch("phone")}
          placeholder="+31 6 1234 5678"
          className="w-full bg-transparent py-2 text-[15px] outline-none placeholder:opacity-60"
          style={{ color: "var(--text-primary)" }}
        />
      </FieldWrap>
    </div>
  );
}
