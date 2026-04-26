"use client";

import { Mail } from "lucide-react";

import { formatDateNL } from "../helpers/format-date-nl";
import type { CreateEmployeeFormValues } from "../types";

interface StepUitnodigenProps {
  form: CreateEmployeeFormValues;
  onJump: (i: number) => void;
}

const COMP_MAP: Record<string, string> = {
  auto: "Auto · km-vergoeding",
  ov: "Openbaar vervoer",
  none: "Geen",
};

export function StepUitnodigen({ form, onJump }: StepUitnodigenProps) {
  const compLabel = `${COMP_MAP[form.compensationType] ?? ""}${
    form.compensationType === "auto"
      ? ` · €${(form.kmRateCents / 100).toFixed(2)}/km`
      : ""
  }`;

  return (
    <div className="space-y-6">
      {/* Invite email preview */}
      <div
        className="overflow-hidden rounded-xl"
        style={{
          border: "1px solid var(--border-subtle)",
          background: "var(--surface-base)",
        }}
      >
        <div
          className="flex items-center gap-2 border-b px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--fg-tertiary)",
          }}
        >
          <Mail size={12} />
          Voorbeeld van de uitnodiging
        </div>
        <div className="p-5">
          <div className="mb-1 text-xs" style={{ color: "var(--fg-tertiary)" }}>
            aan{" "}
            <span style={{ color: "var(--fg-secondary)" }}>
              {form.inviteEmail || "—"}
            </span>
          </div>
          <div
            className="mb-4 text-sm font-medium"
            style={{ color: "var(--fg-primary)" }}
          >
            Welkom bij Casella ✦
          </div>
          <div
            className="space-y-2 text-sm leading-relaxed"
            style={{ color: "var(--fg-secondary)" }}
          >
            <p>
              Hoi{" "}
              <strong style={{ color: "var(--fg-primary)" }}>
                {form.firstName || "…"}
              </strong>
              ,
            </p>
            <p>
              Per{" "}
              <strong style={{ color: "var(--fg-primary)" }}>
                {formatDateNL(form.startDate)}
              </strong>{" "}
              kom je bij het Ascentra-team als{" "}
              <em
                className="font-display"
                style={{ fontStyle: "italic" }}
              >
                {form.jobTitle || "…"}
              </em>
              .
            </p>
            <p>
              Klik hieronder om je account te activeren — daarna zie je meteen je
              contract, uren en vergoedingen.
            </p>
          </div>
          <div className="mt-4">
            <span
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{ background: "var(--aurora-violet)", color: "#fff" }}
            >
              Account activeren →
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <div
            className="text-[11px] font-medium uppercase tracking-wider"
            style={{ color: "var(--fg-tertiary)" }}
          >
            Samenvatting
          </div>
        </div>
        <div
          className="divide-y overflow-hidden rounded-xl"
          style={{
            border: "1px solid var(--border-subtle)",
            background: "var(--surface-base)",
          }}
        >
          <SummaryRow label="Functie" value={form.jobTitle} onEdit={() => onJump(0)} />
          <SummaryRow label="Telefoon" value={form.phone} onEdit={() => onJump(0)} />
          <SummaryRow
            label="Startdatum"
            value={formatDateNL(form.startDate)}
            onEdit={() => onJump(1)}
          />
          <SummaryRow
            label="Contract"
            value={`${form.contractedHours} uur/week`}
            onEdit={() => onJump(1)}
          />
          <SummaryRow
            label="Reisvergoeding"
            value={compLabel}
            onEdit={() => onJump(2)}
          />
          <SummaryRow
            label="Woonadres"
            value={form.address?.fullDisplay ?? ""}
            onEdit={() => onJump(2)}
          />
          <SummaryRow
            label="Noodcontact"
            value={`${form.emergencyName}${form.emergencyPhone ? ` · ${form.emergencyPhone}` : ""}`}
            onEdit={() => onJump(2)}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="group flex items-center gap-4 px-4 py-3">
      <div
        className="w-28 shrink-0 text-[11px] font-medium uppercase tracking-wider"
        style={{ color: "var(--fg-tertiary)" }}
      >
        {label}
      </div>
      <div
        className="flex-1 text-sm"
        style={{ color: value ? "var(--fg-primary)" : "var(--fg-quaternary)" }}
      >
        {value || "niet ingevuld"}
      </div>
      <button
        onClick={onEdit}
        className="rounded-md px-2 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-100"
        style={{ color: "var(--aurora-violet)" }}
      >
        bewerk
      </button>
    </div>
  );
}
