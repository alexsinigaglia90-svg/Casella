export interface EmployeeBonusRow {
  employeeId: string;
  fullName: string;
  ytdAccrualCents: number;
  ytdPaidCents: number;
  outstandingCents: number;
}

function formatEur(cents: number): string {
  const sign = cents < 0 ? "−" : "";
  const abs = Math.abs(cents);
  return `${sign}€ ${(abs / 100).toFixed(2).replace(".", ",")}`;
}

export function EmployeeBonusOverview({ rows }: { rows: EmployeeBonusRow[] }) {
  if (rows.length === 0) {
    return (
      <div
        className="rounded-xl border p-6 text-center text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--fg-tertiary)",
        }}
      >
        Geen bonusgegevens dit jaar.
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
              Medewerker
            </th>
            <th
              className="px-4 py-2 text-right font-medium"
              style={{ color: "var(--fg-secondary)" }}
            >
              YTD opgebouwd
            </th>
            <th
              className="px-4 py-2 text-right font-medium"
              style={{ color: "var(--fg-secondary)" }}
            >
              YTD uitbetaald
            </th>
            <th
              className="px-4 py-2 text-right font-medium"
              style={{ color: "var(--fg-secondary)" }}
            >
              Openstaand
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.employeeId}
              className="border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <td className="px-4 py-2" style={{ color: "var(--fg-primary)" }}>
                {r.fullName}
              </td>
              <td
                className="px-4 py-2 text-right tabular-nums"
                style={{ color: "var(--fg-primary)" }}
              >
                {formatEur(r.ytdAccrualCents)}
              </td>
              <td
                className="px-4 py-2 text-right tabular-nums"
                style={{ color: "var(--fg-secondary)" }}
              >
                {formatEur(r.ytdPaidCents)}
              </td>
              <td
                className="px-4 py-2 text-right tabular-nums"
                style={{ color: "var(--aurora-violet)" }}
              >
                {formatEur(r.outstandingCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
