"use client";

import { useState } from "react";

import { DOMAIN_HUES, oklchEmphasis, oklchSubtleBg } from "@/lib/design/oklch";
import {
  EXPENSE_CATEGORY_MAP,
  type ExpenseCategoryKey,
} from "@/lib/expenses/types";

export interface ExpenseListItem {
  id: string;
  category: string;
  projectName: string | null;
  isInternal: boolean;
  amountCents: number;
  date: string;
  status: "submitted" | "approved" | "rejected" | "paid";
  description: string;
  receiptStoragePath: string;
  rejectionReason: string | null;
  submittedAt: string;
}

const CATEGORY_HUES: Record<ExpenseCategoryKey, number> = {
  travel: DOMAIN_HUES.cool,
  client_meal: DOMAIN_HUES.warm,
  conference: DOMAIN_HUES.spark,
  materials: DOMAIN_HUES.harvest,
  software: DOMAIN_HUES.cloud,
  telecom: DOMAIN_HUES.cool,
  client_gift: DOMAIN_HUES.warm,
  other: DOMAIN_HUES.sun,
};

interface StatusMeta {
  label: string;
  fg: string;
  bg: string;
  icon: string;
}

const STATUS_META: Record<ExpenseListItem["status"], StatusMeta> = {
  submitted: {
    label: "In behandeling",
    fg: "oklch(0.40 0.18 50)",
    bg: "oklch(0.96 0.06 50)",
    icon: "·",
  },
  approved: {
    label: "Goedgekeurd",
    fg: "oklch(0.40 0.18 145)",
    bg: "oklch(0.95 0.06 145)",
    icon: "✓",
  },
  rejected: {
    label: "Afgewezen",
    fg: "oklch(0.45 0.20 25)",
    bg: "oklch(0.96 0.06 25)",
    icon: "✕",
  },
  paid: {
    label: "Uitbetaald",
    fg: "oklch(0.40 0.18 280)",
    bg: "oklch(0.96 0.06 280)",
    icon: "€",
  },
};

function formatEur(cents: number) {
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

function ReceiptThumbnail({ hue }: { hue: number }) {
  return (
    <svg
      width="48"
      height="60"
      viewBox="0 0 48 60"
      aria-hidden
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={`paper-${hue}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fefcf6" />
          <stop offset="100%" stopColor="#f3ecdb" />
        </linearGradient>
      </defs>
      <path
        d="M 4 4 L 44 4 L 44 50 L 40 54 L 36 50 L 32 54 L 28 50 L 24 54 L 20 50 L 16 54 L 12 50 L 8 54 L 4 50 Z"
        fill={`url(#paper-${hue})`}
        stroke={oklchEmphasis(hue)}
        strokeOpacity="0.3"
        strokeWidth="0.5"
      />
      <line x1="10" y1="14" x2="38" y2="14" stroke={oklchEmphasis(hue)} strokeOpacity="0.25" strokeWidth="0.6" />
      <line x1="10" y1="20" x2="32" y2="20" stroke={oklchEmphasis(hue)} strokeOpacity="0.2" strokeWidth="0.6" />
      <line x1="10" y1="26" x2="36" y2="26" stroke={oklchEmphasis(hue)} strokeOpacity="0.2" strokeWidth="0.6" />
      <line x1="10" y1="32" x2="30" y2="32" stroke={oklchEmphasis(hue)} strokeOpacity="0.2" strokeWidth="0.6" />
      <line x1="10" y1="40" x2="38" y2="40" stroke={oklchEmphasis(hue)} strokeOpacity="0.4" strokeWidth="1" />
    </svg>
  );
}

export function ExpenseList({ items }: { items: ExpenseListItem[] }) {
  const [selected, setSelected] = useState<ExpenseListItem | null>(null);

  if (items.length === 0) {
    return (
      <div
        className="rounded-2xl border p-8 text-center text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--fg-tertiary)",
        }}
      >
        Nog geen declaraties ingediend.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, idx) => {
          const catKey = item.category as ExpenseCategoryKey;
          const catConfig = EXPENSE_CATEGORY_MAP[catKey];
          const hue = CATEGORY_HUES[catKey] ?? DOMAIN_HUES.cloud;
          const status = STATUS_META[item.status];
          // Subtle alternating rotation — physical stack feel
          const rotation = idx % 3 === 0 ? -0.6 : idx % 3 === 1 ? 0.4 : -0.2;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="group relative overflow-hidden rounded-2xl border text-left transition-all hover:rotate-0"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--surface-card)",
                transform: `rotate(${rotation}deg)`,
                boxShadow:
                  "0 1px 0 rgba(0,0,0,0.04) inset, 0 6px 14px -6px rgba(14,22,33,0.18)",
              }}
            >
              <div
                className="h-1"
                style={{ background: oklchEmphasis(hue) }}
              />
              <div className="flex items-start gap-4 p-5">
                <ReceiptThumbnail hue={hue} />
                <div className="min-w-0 flex-1">
                  <div
                    className="font-mono uppercase"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      color: oklchEmphasis(hue),
                    }}
                  >
                    {catConfig?.label ?? item.category}
                  </div>
                  <div
                    className="mt-1 font-display"
                    style={{
                      fontSize: 24,
                      fontWeight: 500,
                      color: "var(--fg-primary)",
                    }}
                  >
                    {formatEur(item.amountCents)}
                  </div>
                  <div
                    className="mt-1 font-mono"
                    style={{ fontSize: 11, color: "var(--fg-tertiary)" }}
                  >
                    {item.date}
                    {" · "}
                    {item.isInternal
                      ? "Intern Casella"
                      : (item.projectName ?? "—")}
                  </div>
                  <div className="mt-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono uppercase"
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        background: status.bg,
                        color: status.fg,
                      }}
                    >
                      <span aria-hidden>{status.icon}</span>
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end bg-black/40"
          onClick={() => setSelected(null)}
        >
          <div
            className="h-full w-full max-w-md overflow-y-auto p-6 shadow-xl"
            style={{ background: "var(--surface-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2
                className="font-display"
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  color: "var(--fg-primary)",
                }}
              >
                Declaratie
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{
                  fontSize: 20,
                  color: "var(--fg-tertiary)",
                }}
                aria-label="Sluit"
              >
                ×
              </button>
            </div>
            <dl
              className="space-y-3"
              style={{ fontSize: 13, color: "var(--fg-primary)" }}
            >
              {[
                [
                  "Categorie",
                  EXPENSE_CATEGORY_MAP[selected.category as ExpenseCategoryKey]
                    ?.label ?? selected.category,
                ],
                ["Datum", selected.date],
                ["Bedrag", formatEur(selected.amountCents)],
                [
                  "Project",
                  selected.isInternal
                    ? "Intern Casella"
                    : (selected.projectName ?? "—"),
                ],
                ["Status", STATUS_META[selected.status].label],
                ["Omschrijving", selected.description],
                ["Bonnetje", selected.receiptStoragePath],
                ...(selected.rejectionReason
                  ? [["Reden afwijzing", selected.rejectionReason]]
                  : []),
              ].map(([label, value]) => (
                <div key={label}>
                  <dt
                    className="font-mono uppercase"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      color: "var(--fg-tertiary)",
                    }}
                  >
                    {label}
                  </dt>
                  <dd className="mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
            <div
              className="mt-6 rounded-lg p-3"
              style={{
                background: oklchSubtleBg(
                  CATEGORY_HUES[selected.category as ExpenseCategoryKey] ?? DOMAIN_HUES.cloud,
                ),
                fontSize: 11,
                color: "var(--fg-tertiary)",
              }}
            >
              Ingediend op {selected.submittedAt.slice(0, 10)}.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
