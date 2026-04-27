import Link from "next/link";
import type { NmbrsPayslipSummary } from "@casella/nmbrs";

const MONTH_NAMES = [
  "Januari", "Februari", "Maart", "April", "Mei", "Juni",
  "Juli", "Augustus", "September", "Oktober", "November", "December",
];

function formatEur(cents: number) {
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

interface PayslipListProps {
  payslips: NmbrsPayslipSummary[];
  skipped?: string;
}

export function PayslipList({ payslips, skipped }: PayslipListProps) {
  if (skipped) {
    return (
      <div
        className="rounded-xl border p-6 text-center text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--fg-tertiary)",
        }}
      >
        Loonstroken worden uit Nmbrs gehaald — koppel Nmbrs-credentials in productie om je strookjes te zien.
      </div>
    );
  }

  if (payslips.length === 0) {
    return (
      <div
        className="rounded-xl border p-8 text-center text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--fg-tertiary)",
        }}
      >
        Geen loonstroken gevonden.
      </div>
    );
  }

  return (
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
              Periode
            </th>
            <th className="px-4 py-3 font-medium" style={{ color: "var(--fg-tertiary)" }}>
              Bruto
            </th>
            <th className="px-4 py-3 font-medium" style={{ color: "var(--fg-tertiary)" }}>
              Beschikbaar
            </th>
            <th className="px-4 py-3 font-medium" style={{ color: "var(--fg-tertiary)" }}>
              Download
            </th>
          </tr>
        </thead>
        <tbody>
          {payslips.map((p) => (
            <tr
              key={`${p.year}-${p.period}`}
              className="border-b last:border-0"
              style={{
                borderColor: "var(--border-subtle)",
                backgroundColor: "var(--surface-card)",
              }}
            >
              <td className="px-4 py-3" style={{ color: "var(--fg-primary)" }}>
                {MONTH_NAMES[(p.period - 1) % 12]} {p.year}
              </td>
              <td className="px-4 py-3 font-medium" style={{ color: "var(--fg-primary)" }}>
                {formatEur(p.amountGrossCents)}
              </td>
              <td className="px-4 py-3" style={{ color: "var(--fg-secondary)" }}>
                {p.availableSince}
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/api/loonstroken/${p.year}/${p.period}`}
                  className="text-sm underline"
                  style={{ color: "var(--aurora-violet)" }}
                >
                  Download PDF
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
