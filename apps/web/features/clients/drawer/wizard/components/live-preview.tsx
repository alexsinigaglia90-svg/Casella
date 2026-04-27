"use client";

import { Building2, Hash, Mail, MapPin, Phone, Sparkles, User } from "lucide-react";

import { stringHueHash } from "../helpers/format";
import type { CreateClientFormValues } from "../types";

interface LivePreviewProps {
  form: CreateClientFormValues;
  step: number;
  kvkValidated?: boolean;
}

const TIPS = [
  "Vul het KvK-nummer in — we zoeken dan automatisch de bedrijfsnaam en het adres op.",
  "Als het e-mailadres van een zakelijk domein is, vullen we de bedrijfsnaam automatisch voor je in.",
  "Het adres wordt gebruikt voor projecten, declaraties en routeplanning.",
  "Controleer de gegevens — je kunt ze later altijd bijwerken in het klantprofiel.",
];

export function LivePreview({ form, step, kvkValidated = false }: LivePreviewProps) {
  const hasName = Boolean(form.name.trim());
  const hue = hasName ? stringHueHash(form.name) : 240;

  function initials(): string {
    const name = form.name.trim();
    if (!name) return "?";
    const words = name.split(/\s+/);
    if (words.length >= 2) {
      return ((words[0]?.[0] ?? "") + (words[words.length - 1]?.[0] ?? "")).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  return (
    <div
      className="flex h-full flex-col gap-5 p-8"
      style={{ background: "var(--surface-base)" }}
    >
      <div
        className="text-[10px] font-mono uppercase tracking-[0.15em]"
        style={{ color: "var(--fg-tertiary)" }}
      >
        Zo ziet de klantkaart eruit
      </div>

      {/* Card preview */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 transition-all"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          backdropFilter: "blur(16px)",
          minHeight: 280,
        }}
        data-grow-in
      >
        {/* Ambient aurora glow */}
        <div
          aria-hidden
          className="absolute -right-12 -top-12 h-40 w-40 rounded-full"
          style={{
            background: `radial-gradient(circle, oklch(0.72 0.18 ${hue}) 0%, transparent 70%)`,
            opacity: 0.35,
            filter: "blur(20px)",
            transition: "background 600ms ease",
          }}
        />

        {/* Monogram + name row */}
        <div className="relative flex items-center gap-3">
          <div
            className="flex shrink-0 items-center justify-center rounded-full text-base font-semibold text-white"
            style={{
              width: 52,
              height: 52,
              background: `linear-gradient(135deg, oklch(0.72 0.17 ${hue}), oklch(0.55 0.20 ${(hue + 40) % 360}))`,
              letterSpacing: "-0.02em",
              textShadow: "0 1px 2px rgba(0,0,0,0.25)",
              transition: "background 600ms ease",
            }}
          >
            {initials()}
          </div>
          <div className="min-w-0">
            <div
              className="truncate text-[16px] font-medium"
              style={{ color: "var(--fg-primary)" }}
            >
              {hasName ? (
                form.name
              ) : (
                <span style={{ color: "var(--fg-quaternary)" }}>
                  Bedrijfsnaam…
                </span>
              )}
            </div>
            {form.kvk && (
              <div
                className="flex items-center gap-1.5 truncate text-[12px] font-mono"
                style={{ color: "var(--fg-tertiary)" }}
                data-grow-in
              >
                <Hash size={10} />
                KvK {form.kvk}
                {kvkValidated && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      background: "rgba(61, 216, 168, 0.14)",
                      color: "var(--aurora-teal)",
                    }}
                    data-grow-in
                  >
                    ✓
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact + address rows */}
        <div className="relative mt-5 space-y-2.5 text-sm">
          <PreviewRow icon={<User size={13} />} value={form.contactName} />
          <PreviewRow icon={<Mail size={13} />} value={form.contactEmail} />
          <PreviewRow icon={<Phone size={13} />} value={form.contactPhone} />
          <PreviewRow
            icon={<Building2 size={13} />}
            value={form.address?.city ?? null}
          />
          <PreviewRow
            icon={<MapPin size={13} />}
            value={form.address?.fullDisplay ?? null}
          />
        </div>

        {/* Status badge */}
        <div
          className="relative mt-5 flex items-center gap-2 border-t pt-4"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              background: "rgba(75, 163, 255, 0.14)",
              color: "var(--aurora-blue)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--aurora-blue)" }}
            />
            Nieuwe relatie
          </span>
          <span
            className="ml-auto text-[10px] font-mono"
            style={{ color: "var(--fg-tertiary)" }}
          >
            #nieuw
          </span>
        </div>
      </div>

      {/* Tip card */}
      <div
        className="rounded-xl p-4 text-sm"
        style={{
          background: "rgba(123, 92, 255, 0.06)",
          border: "1px solid rgba(123, 92, 255, 0.18)",
          color: "var(--fg-secondary)",
        }}
      >
        <div
          className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider"
          style={{ color: "var(--aurora-violet)" }}
        >
          <Sparkles size={11} /> Tip
        </div>
        {TIPS[step] ?? TIPS[0]}
      </div>
    </div>
  );
}

function PreviewRow({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5" data-grow-in>
      <div
        className="flex h-4 w-4 shrink-0 items-center justify-center"
        style={{ color: "var(--fg-tertiary)" }}
      >
        {icon}
      </div>
      <div className="flex-1 truncate" style={{ color: "var(--fg-secondary)" }}>
        {value}
      </div>
    </div>
  );
}
