"use client";

import { useState } from "react";

import { EXPENSE_CATEGORY_MAP, type ExpenseCategoryKey } from "@/lib/expenses/types";

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

const STATUS_META: Record<
  ExpenseListItem["status"],
  { bg: string; fg: string; label: string }
> = {
  submitted: {
    bg: "rgba(234, 179, 8, 0.15)",
    fg: "rgb(234, 179, 8)",
    label: "In behandeling",
  },
  approved: {
    bg: "rgba(34, 197, 94, 0.15)",
    fg: "rgb(34, 197, 94)",
    label: "Goedgekeurd",
  },
  rejected: {
    bg: "rgba(239, 68, 68, 0.15)",
    fg: "rgb(239, 68, 68)",
    label: "Afgewezen",
  },
  paid: {
    bg: "rgba(139, 92, 246, 0.15)",
    fg: "rgb(139, 92, 246)",
    label: "Uitbetaald",
  },
};

function formatEur(cents: number) {
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function ExpenseList({ items }: { items: ExpenseListItem[] }) {
  const [selected, setSelected] = useState<ExpenseListItem | null>(null);

  if (items.length === 0) {
    return (
      <div
        className="rounded-xl border p-8 text-center text-sm"
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
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b text-left"
              style={{
                borderColor: "var(--border-subtle)",
                backgroundColor: "var(--surface-base)",
              }}
            >
              <th className="px-4 py-3 font-medium" style={{ color: "var(--fg-tertiary)" }}>
                Datum
              </th>
              <th className="px-4 py-3 font-medium" style={{ color: "var(--fg-tertiary)" }}>
                Categorie
              </th>
              <th className="px-4 py-3 font-medium" style={{ color: "var(--fg-tertiary)" }}>
                Project
              </th>
              <th className="px-4 py-3 font-medium" style={{ color: "var(--fg-tertiary)" }}>
                Bedrag
              </th>
              <th className="px-4 py-3 font-medium" style={{ color: "var(--fg-tertiary)" }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const catConfig = EXPENSE_CATEGORY_MAP[item.category as ExpenseCategoryKey];
              const status = STATUS_META[item.status];
              return (
                <tr
                  key={item.id}
                  className="cursor-pointer border-b transition-colors last:border-0"
                  style={{
                    borderColor: "var(--border-subtle)",
                    backgroundColor: "var(--surface-card)",
                  }}
                  onClick={() => setSelected(item)}
                >
                  <td className="px-4 py-3" style={{ color: "var(--fg-primary)" }}>
                    {item.date}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--fg-primary)" }}>
                    {catConfig?.label ?? item.category}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--fg-secondary)" }}>
                    {item.isInternal ? "Intern Ascentra" : (item.projectName ?? "—")}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--fg-primary)" }}>
                    {formatEur(item.amountCents)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: status.bg, color: status.fg }}
                    >
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end bg-black/40"
          onClick={() => setSelected(null)}
        >
          <div
            className="h-full w-full max-w-md overflow-y-auto p-6 shadow-xl"
            style={{ backgroundColor: "var(--surface-card)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold" style={{ color: "var(--fg-primary)" }}>
                Declaratie details
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-xl"
                style={{ color: "var(--fg-tertiary)" }}
              >
                ×
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              {[
                ["Categorie", EXPENSE_CATEGORY_MAP[selected.category as ExpenseCategoryKey]?.label ?? selected.category],
                ["Datum", selected.date],
                ["Bedrag", formatEur(selected.amountCents)],
                ["Project", selected.isInternal ? "Intern Ascentra" : (selected.projectName ?? "—")],
                ["Status", STATUS_META[selected.status]?.label],
                ["Omschrijving", selected.description],
                ["Bonnetje", selected.receiptStoragePath],
                ...(selected.rejectionReason ? [["Reden afwijzing", selected.rejectionReason]] : []),
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="font-medium" style={{ color: "var(--fg-tertiary)" }}>
                    {label}
                  </dt>
                  <dd style={{ color: "var(--fg-primary)" }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </>
  );
}
