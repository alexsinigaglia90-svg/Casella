import type { CarePackageCompany } from "./types";

export interface CarePackageRow {
  id: string;
  type: "annual_distribution" | "exit_payout";
  year: number;
  amountCents: number;
  transactionRef: string | null;
}

export interface CarePackageData {
  ascentra: { annualDistributions: CarePackageRow[]; exitPayouts: CarePackageRow[] };
  operis: { annualDistributions: CarePackageRow[]; exitPayouts: CarePackageRow[] };
  astra: { annualDistributions: CarePackageRow[]; exitPayouts: CarePackageRow[] };
}

const COMPANY_LABELS: Record<CarePackageCompany, string> = {
  ascentra: "Ascentra",
  operis: "Operis",
  astra: "Astra",
};

function formatEur(cents: number): string {
  const sign = cents < 0 ? "−" : "";
  const abs = Math.abs(cents);
  return `${sign}€ ${(abs / 100).toFixed(2).replace(".", ",")}`;
}

export function WinstdelingSummary({ data }: { data: CarePackageData }) {
  const totalRows =
    data.ascentra.annualDistributions.length +
    data.ascentra.exitPayouts.length +
    data.operis.annualDistributions.length +
    data.operis.exitPayouts.length +
    data.astra.annualDistributions.length +
    data.astra.exitPayouts.length;

  if (totalRows === 0) {
    return (
      <div
        className="rounded-xl border p-8 text-center text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--fg-tertiary)",
        }}
      >
        Care Package wordt vastgesteld in jaarlijkse business retraite — nog geen verdeling vastgelegd.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <CompanyCard company="ascentra" rows={data.ascentra} />
      <CompanyCard company="operis" rows={data.operis} />
      <CompanyCard company="astra" rows={data.astra} />
    </div>
  );
}

function CompanyCard({
  company,
  rows,
}: {
  company: CarePackageCompany;
  rows: { annualDistributions: CarePackageRow[]; exitPayouts: CarePackageRow[] };
}) {
  const total =
    rows.annualDistributions.reduce((s, r) => s + r.amountCents, 0) +
    rows.exitPayouts.reduce((s, r) => s + r.amountCents, 0);

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        borderColor: "var(--border-subtle)",
        backgroundColor: "var(--surface-card)",
      }}
    >
      <header className="mb-3">
        <h3
          className="text-lg font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          {COMPANY_LABELS[company]}
        </h3>
        <p
          className="text-xl font-semibold tabular-nums"
          style={{ color: "var(--aurora-violet)" }}
        >
          {formatEur(total)}
        </p>
      </header>

      <Section title="Jaarlijkse verdeling">
        {rows.annualDistributions.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
            Geen records.
          </p>
        ) : (
          <ul className="space-y-1">
            {rows.annualDistributions.map((r) => (
              <li
                key={r.id}
                className="flex justify-between text-sm"
                style={{ color: "var(--fg-secondary)" }}
              >
                <span>{r.year}</span>
                <span className="tabular-nums">{formatEur(r.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Exit-events">
        {rows.exitPayouts.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
            Geen records.
          </p>
        ) : (
          <ul className="space-y-1">
            {rows.exitPayouts.map((r) => (
              <li
                key={r.id}
                className="flex justify-between text-sm"
                style={{ color: "var(--fg-secondary)" }}
              >
                <span>
                  {r.year}
                  {r.transactionRef ? ` — ${r.transactionRef}` : ""}
                </span>
                <span className="tabular-nums">{formatEur(r.amountCents)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3">
      <p
        className="mb-1 text-xs uppercase tracking-wide"
        style={{ color: "var(--fg-tertiary)" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}
