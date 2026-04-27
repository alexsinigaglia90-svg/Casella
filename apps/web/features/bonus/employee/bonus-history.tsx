export interface BonusHistoryRow {
  id: string;
  period: string;
  type: "accrual" | "adjustment" | "payout";
  amountCents: number;
  description: string | null;
  projectName: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<BonusHistoryRow["type"], string> = {
  accrual: "Opbouw",
  adjustment: "Adjustment",
  payout: "Uitbetaling",
};

function formatEur(cents: number): string {
  const sign = cents < 0 ? "−" : "";
  const abs = Math.abs(cents);
  return `${sign}€ ${(abs / 100).toFixed(2).replace(".", ",")}`;
}

export function BonusHistory({ rows }: { rows: BonusHistoryRow[] }) {
  if (rows.length === 0) {
    return (
      <div
        className="rounded-xl border p-6 text-center text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--fg-tertiary)",
        }}
      >
        Nog geen bonus-records.
      </div>
    );
  }
  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <table className="w-full text-sm">
        <thead style={{ backgroundColor: "var(--surface-base)" }}>
          <tr>
            <th
              className="px-4 py-2 text-left font-medium"
              style={{ color: "var(--fg-secondary)" }}
            >
              Periode
            </th>
            <th
              className="px-4 py-2 text-left font-medium"
              style={{ color: "var(--fg-secondary)" }}
            >
              Type
            </th>
            <th
              className="px-4 py-2 text-left font-medium"
              style={{ color: "var(--fg-secondary)" }}
            >
              Project / Toelichting
            </th>
            <th
              className="px-4 py-2 text-right font-medium"
              style={{ color: "var(--fg-secondary)" }}
            >
              Bedrag
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <td className="px-4 py-2" style={{ color: "var(--fg-primary)" }}>
                {r.period}
              </td>
              <td
                className="px-4 py-2"
                style={{ color: "var(--fg-secondary)" }}
              >
                {TYPE_LABELS[r.type]}
              </td>
              <td className="px-4 py-2" style={{ color: "var(--fg-secondary)" }}>
                {r.projectName ?? r.description ?? "—"}
              </td>
              <td
                className="px-4 py-2 text-right tabular-nums"
                style={{ color: "var(--fg-primary)" }}
              >
                {formatEur(r.amountCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
