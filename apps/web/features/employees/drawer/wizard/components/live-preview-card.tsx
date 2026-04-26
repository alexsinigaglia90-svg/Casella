"use client";

import { Mail, Phone, Calendar, Clock, Car, Train, MapPin, Sparkles } from "lucide-react";
import type { CreateEmployeeFormValues } from "../types";
import { formatDateNL } from "../helpers/format-date-nl";

interface LivePreviewCardProps {
  form: CreateEmployeeFormValues;
  step: number;
}

const TIPS = [
  "Vul het e-mailadres in — we genereren dan automatisch de voor- en achternaam.",
  "40 uur is gangbaar voor full-time. Voor part-time geldt vaak 32 of 36 uur.",
  "Bij reisvergoeding 'auto' geldt standaard €0,23/km — fiscaal onbelast.",
  "Controleer de gegevens één keer — je kunt ze later altijd nog bijwerken in het profiel.",
];

export function LivePreviewCard({ form, step }: LivePreviewCardProps) {
  const hasName = form.firstName || form.lastName;
  const hue = (form.firstName.length + form.lastName.length) * 23 + 180;

  function initials() {
    const fi = form.firstName?.[0] ?? "";
    const li = form.lastName?.[0] ?? "";
    return (fi + li).toUpperCase() || "?";
  }

  const compIcon =
    form.compensationType === "ov" ? (
      <Train size={13} />
    ) : form.compensationType === "auto" ? (
      <Car size={13} />
    ) : null;

  const compValue =
    form.compensationType === "auto"
      ? `Auto · €${(form.kmRateCents / 100).toFixed(2)}/km`
      : form.compensationType === "ov"
        ? "OV · op declaratie"
        : form.compensationType === "none"
          ? "Geen reisvergoeding"
          : null;

  return (
    <div
      className="flex h-full flex-col gap-5 p-8"
      style={{ background: "var(--surface-base)" }}
    >
      <div
        className="text-[10px] font-mono uppercase tracking-[0.15em]"
        style={{ color: "var(--fg-tertiary)" }}
      >
        Zo ziet hun kaart eruit
      </div>

      {/* Card preview */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 transition-all"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-subtle)",
          backdropFilter: "blur(16px)",
          minHeight: 300,
        }}
      >
        {/* ambient aurora */}
        <div
          aria-hidden
          className="absolute -right-12 -top-12 h-40 w-40 rounded-full"
          style={{
            background: `radial-gradient(circle, oklch(0.72 0.18 ${hue}) 0%, transparent 70%)`,
            opacity: 0.35,
            filter: "blur(20px)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-medium text-white"
            style={{
              background: `linear-gradient(135deg, oklch(0.72 0.17 ${hue}), oklch(0.55 0.20 ${(hue + 35) % 360}))`,
              letterSpacing: "-0.02em",
              textShadow: "0 1px 2px rgba(0,0,0,0.25)",
            }}
          >
            {initials()}
          </div>
          <div className="min-w-0">
            <div
              className="truncate text-[17px] font-medium"
              style={{ color: "var(--fg-primary)" }}
            >
              {hasName ? (
                `${form.firstName} ${form.lastName}`.trim()
              ) : (
                <span style={{ color: "var(--fg-quaternary)" }}>
                  Naam verschijnt hier…
                </span>
              )}
            </div>
            <div className="truncate text-sm" style={{ color: "var(--fg-secondary)" }}>
              {form.jobTitle || (
                <span style={{ color: "var(--fg-quaternary)" }}>Functie…</span>
              )}
            </div>
          </div>
        </div>

        <div className="relative mt-5 space-y-2.5 text-sm">
          <PreviewRow icon={<Mail size={13} />} value={form.inviteEmail} />
          <PreviewRow icon={<Phone size={13} />} value={form.phone} />
          <PreviewRow
            icon={<Calendar size={13} />}
            value={form.startDate ? `Start ${formatDateNL(form.startDate)}` : null}
          />
          <PreviewRow
            icon={<Clock size={13} />}
            value={form.contractedHours ? `${form.contractedHours} uur/week` : null}
          />
          <PreviewRow icon={compIcon} value={compValue} />
          <PreviewRow
            icon={<MapPin size={13} />}
            value={form.address?.fullDisplay ?? null}
          />
        </div>

        <div
          className="relative mt-5 flex items-center gap-2 border-t pt-4"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              background: "rgba(245, 197, 92, 0.18)",
              color: "var(--aurora-amber)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--aurora-amber)" }}
            />
            Uitnodiging pending
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
        {TIPS[step]}
      </div>
    </div>
  );
}

function PreviewRow({
  icon,
  value,
}: {
  icon: React.ReactNode | null;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-4 w-4 shrink-0 items-center justify-center"
        style={{ color: "var(--fg-tertiary)" }}
      >
        {icon}
      </div>
      <div
        className="flex-1 truncate"
        style={{ color: value ? "var(--fg-secondary)" : "var(--fg-quaternary)" }}
      >
        {value || "—"}
      </div>
    </div>
  );
}
