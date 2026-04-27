"use client";

import { ArrowRight, Pencil } from "lucide-react";
import { useState } from "react";

import type { CreateClientFormValues } from "../types";

interface StepCheckProps {
  form: CreateClientFormValues;
  onJump: (i: number) => void;
}

interface HoverRowProps {
  label: string;
  value: string;
  onEdit: () => void;
}

function HoverRow({ label, value, onEdit }: HoverRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group flex cursor-default items-baseline justify-between gap-4 rounded-lg px-2 py-2 transition-colors"
      style={{
        background: hovered ? "var(--surface-deep)" : "transparent",
        marginLeft: "-0.5rem",
        marginRight: "-0.5rem",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className="shrink-0 text-[11px] font-medium uppercase tracking-wider"
        style={{ color: "var(--fg-tertiary)" }}
      >
        {label}
      </span>
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="truncate text-sm"
          style={{ color: "var(--fg-primary)" }}
        >
          {value || "—"}
        </span>
        {hovered && (
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 rounded-md p-1 transition-colors hover:opacity-80"
            style={{ color: "var(--aurora-violet)" }}
            aria-label={`Bewerk ${label}`}
            data-grow-in
          >
            <Pencil size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

export function StepCheck({ form, onJump }: StepCheckProps) {
  return (
    <div className="space-y-6">
      {/* "Wat gebeurt er na opslaan" banner */}
      <div
        className="rounded-xl p-4"
        style={{
          background: "rgba(75, 163, 255, 0.08)",
          border: "1px solid rgba(75, 163, 255, 0.22)",
        }}
        data-grow-in
      >
        <div
          className="mb-2 text-[11px] font-medium uppercase tracking-wider"
          style={{ color: "var(--aurora-blue)" }}
        >
          Wat gebeurt er na opslaan?
        </div>
        <ul className="space-y-1.5">
          {[
            "De klant verschijnt direct in de klantenoverzicht.",
            "Je kunt direct projecten en opdrachten koppelen.",
            "Alle gegevens zijn later te bewerken via het klantprofiel.",
          ].map((text) => (
            <li
              key={text}
              className="flex items-start gap-2 text-[13px]"
              style={{ color: "var(--fg-secondary)" }}
            >
              <ArrowRight
                size={12}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--aurora-blue)" }}
              />
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Bedrijf section */}
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-base)",
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h4
            className="text-[11px] font-medium uppercase tracking-wider"
            style={{ color: "var(--fg-tertiary)" }}
          >
            Bedrijf
          </h4>
          <button
            type="button"
            onClick={() => onJump(0)}
            className="text-[11px] hover:underline"
            style={{ color: "var(--aurora-violet)" }}
          >
            Bewerken
          </button>
        </div>
        <HoverRow label="Naam" value={form.name} onEdit={() => onJump(0)} />
        <HoverRow label="KvK" value={form.kvk} onEdit={() => onJump(0)} />
      </div>

      {/* Contact section */}
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-base)",
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h4
            className="text-[11px] font-medium uppercase tracking-wider"
            style={{ color: "var(--fg-tertiary)" }}
          >
            Contact
          </h4>
          <button
            type="button"
            onClick={() => onJump(1)}
            className="text-[11px] hover:underline"
            style={{ color: "var(--aurora-violet)" }}
          >
            Bewerken
          </button>
        </div>
        <HoverRow label="Naam" value={form.contactName} onEdit={() => onJump(1)} />
        <HoverRow label="E-mail" value={form.contactEmail} onEdit={() => onJump(1)} />
        <HoverRow label="Telefoon" value={form.contactPhone} onEdit={() => onJump(1)} />
      </div>

      {/* Adres section */}
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-base)",
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h4
            className="text-[11px] font-medium uppercase tracking-wider"
            style={{ color: "var(--fg-tertiary)" }}
          >
            Adres
          </h4>
          <button
            type="button"
            onClick={() => onJump(2)}
            className="text-[11px] hover:underline"
            style={{ color: "var(--aurora-violet)" }}
          >
            Bewerken
          </button>
        </div>
        <HoverRow
          label="Adres"
          value={form.address?.fullDisplay ?? ""}
          onEdit={() => onJump(2)}
        />
      </div>
    </div>
  );
}
