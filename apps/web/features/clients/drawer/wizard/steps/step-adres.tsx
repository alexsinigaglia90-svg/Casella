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
  const hasAddress = Boolean(
    form.address?.street && form.address.houseNumber && form.address.city,
  );

  return (
    <div className="space-y-6">
      {/* Address search */}
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

      {/* Mini-map SVG — shown when address has enough data */}
      {hasAddress && (
        <div
          className="overflow-hidden rounded-xl"
          style={{
            border: "1px solid var(--border-subtle)",
            background: "var(--surface-base)",
          }}
          data-grow-in
        >
          <MiniMap
            city={form.address?.city ?? ""}
            street={form.address?.street ?? ""}
          />
          <div
            className="px-4 py-3 text-[12px]"
            style={{ color: "var(--fg-secondary)", borderTop: "1px solid var(--border-subtle)" }}
          >
            <span className="font-medium" style={{ color: "var(--fg-primary)" }}>
              {form.address?.street} {form.address?.houseNumber}
              {form.address?.houseNumberAddition ?? ""}
            </span>
            {" — "}
            {form.address?.postalCode} {form.address?.city}
          </div>
        </div>
      )}
    </div>
  );
}

/** Decorative SVG mini-map — no real geo data, purely illustrative. */
function MiniMap({ city, street }: { city: string; street: string }) {
  // Seed a stable pseudo-random offset from the city name so the grid looks
  // slightly different per address.
  let seed = 0;
  for (let i = 0; i < city.length; i++) seed = (seed * 31 + city.charCodeAt(i)) | 0;
  const ox = Math.abs(seed % 12);
  const oy = Math.abs((seed >> 4) % 8);

  return (
    <svg
      viewBox="0 0 320 140"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Illustratief kaartje voor ${street}, ${city}`}
      role="img"
      style={{ display: "block", width: "100%", height: 140 }}
    >
      {/* Background */}
      <rect width="320" height="140" fill="var(--surface-deep, #efe8d9)" />

      {/* Grid lines — horizontal */}
      {Array.from({ length: 7 }, (_, i) => (
        <line
          key={`h${i}`}
          x1="0"
          y1={15 + (i + oy) * 20}
          x2="320"
          y2={15 + (i + oy) * 20}
          stroke="var(--border-subtle, rgba(14,22,33,0.10))"
          strokeWidth="1"
        />
      ))}
      {/* Grid lines — vertical */}
      {Array.from({ length: 11 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={(i + ox) * 30}
          y1="0"
          x2={(i + ox) * 30}
          y2="140"
          stroke="var(--border-subtle, rgba(14,22,33,0.10))"
          strokeWidth="1"
        />
      ))}

      {/* Stylised street blocks */}
      <rect x="80" y="50" width="60" height="18" rx="3" fill="rgba(14,22,33,0.07)" />
      <rect x="170" y="50" width="70" height="18" rx="3" fill="rgba(14,22,33,0.07)" />
      <rect x="80" y="80" width="45" height="18" rx="3" fill="rgba(14,22,33,0.07)" />
      <rect x="145" y="80" width="55" height="18" rx="3" fill="rgba(14,22,33,0.07)" />
      <rect x="215" y="80" width="40" height="18" rx="3" fill="rgba(14,22,33,0.07)" />
      {/* Main road */}
      <rect x="0" y="64" width="320" height="12" rx="0" fill="rgba(255,255,255,0.35)" />

      {/* Pin marker */}
      <circle cx="160" cy="70" r="10" fill="var(--aurora-violet, #7b5cff)" opacity="0.25" />
      <circle cx="160" cy="70" r="5" fill="var(--aurora-violet, #7b5cff)" />
      <line
        x1="160"
        y1="75"
        x2="160"
        y2="85"
        stroke="var(--aurora-violet, #7b5cff)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Compass rose — bottom right */}
      <g transform="translate(294, 118)">
        <text
          fontSize="8"
          fontFamily="monospace"
          fill="var(--fg-tertiary, rgba(14,22,33,0.45))"
          textAnchor="middle"
          x="0"
          y="-10"
        >
          N
        </text>
        <line
          x1="0"
          y1="-8"
          x2="0"
          y2="8"
          stroke="var(--fg-tertiary, rgba(14,22,33,0.45))"
          strokeWidth="1.5"
        />
        <line
          x1="-8"
          y1="0"
          x2="8"
          y2="0"
          stroke="var(--fg-tertiary, rgba(14,22,33,0.45))"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
}
