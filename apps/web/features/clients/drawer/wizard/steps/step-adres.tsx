"use client";

import { MapPin } from "lucide-react";

import type { CreateClientFormValues } from "../types";

import { AddressInput } from "@/components/address-input/address-input";

interface StepAdresProps {
  form: CreateClientFormValues;
  update: (patch: Partial<CreateClientFormValues>) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouch: (key: string) => void;
}

export function StepAdres({
  form,
  update,
  errors,
  touched,
  setTouch,
}: StepAdresProps) {
  return (
    <div className="space-y-6">
      <div>
        <div
          className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider"
          style={{ color: "var(--fg-tertiary)" }}
        >
          <MapPin size={11} /> Vestigingsadres
        </div>
        <p className="mb-2 text-[11px]" style={{ color: "var(--fg-tertiary)" }}>
          Gebruikt voor projecten en routeplanning.
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
    </div>
  );
}
