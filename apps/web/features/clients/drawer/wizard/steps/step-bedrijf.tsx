"use client";

import { Building2, Hash, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { formatKvk } from "../helpers/format";
import { lookupKvk } from "../helpers/kvk-lookup";
import type { CreateClientFormValues } from "../types";

import { FieldWrap } from "@/features/employees/drawer/wizard/components/field-wrap";

interface StepBedrijfProps {
  form: CreateClientFormValues;
  update: (patch: Partial<CreateClientFormValues>) => void;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouch: (key: string) => void;
  onKvkValidated?: (validated: boolean) => void;
  kvkStrict?: boolean;
}

export function StepBedrijf({
  form,
  update,
  errors,
  touched,
  setTouch,
  onKvkValidated,
  kvkStrict = false,
}: StepBedrijfProps) {
  const [lookingUp, setLookingUp] = useState(false);
  const kvkReady = form.kvk.replace(/\D/g, "").length === 8;

  async function handleKvkLookup() {
    if (!kvkReady) return;
    setLookingUp(true);
    try {
      const result = await lookupKvk(form.kvk);
      if (result) {
        const patch: Partial<CreateClientFormValues> = {};
        if (!form.name.trim()) patch.name = result.name;
        update(patch);
        onKvkValidated?.(true);
        toast.success("Gegevens uit KvK gevuld");
      } else {
        onKvkValidated?.(false);
        if (kvkStrict) {
          toast.error("Geen bedrijf gevonden — vul handmatig in of controleer het nummer");
        } else {
          toast.info("Geen bedrijf gevonden — vul handmatig in");
        }
      }
    } catch {
      toast.error("KvK lookup mislukt — probeer het later opnieuw");
    } finally {
      setLookingUp(false);
    }
  }

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
          // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional: first field of wizard receives focus on mount
          autoFocus
        />
      </FieldWrap>

      <FieldWrap
        className="md:col-span-2"
        label="KvK-nummer"
        htmlFor="cli-kvk"
        hint="Optioneel — bij 8 cijfers zoeken we de gegevens op."
        icon={<Hash size={15} />}
      >
        <div className="flex w-full items-center gap-2">
          <input
            id="cli-kvk"
            type="text"
            inputMode="numeric"
            value={form.kvk}
            onChange={(e) => {
              const formatted = formatKvk(e.target.value);
              update({ kvk: formatted });
              if (formatted.length < 8) onKvkValidated?.(false);
            }}
            placeholder="12345678"
            maxLength={8}
            className="flex-1 bg-transparent py-2 font-mono text-[15px] outline-none placeholder:opacity-60"
            style={{ color: "var(--fg-primary)", letterSpacing: "0.08em" }}
          />
          {kvkReady && (
            <button
              type="button"
              onClick={() => void handleKvkLookup()}
              disabled={lookingUp}
              className="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all hover:opacity-80 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, var(--aurora-violet), var(--aurora-blue))",
                color: "#fff",
              }}
              data-grow-in
            >
              {lookingUp ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Search size={11} />
              )}
              {lookingUp ? "Zoeken…" : "Opzoeken"}
            </button>
          )}
        </div>
      </FieldWrap>
    </div>
  );
}
