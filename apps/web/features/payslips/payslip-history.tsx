import type { NmbrsPayslipSummary } from "@casella/nmbrs";
import Link from "next/link";

import { DOMAIN_HUES, oklchEmphasis, oklchSubtleBg } from "@/lib/design/oklch";

const MONTHS_NL_SHORT = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

function formatEur(cents: number): string {
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

interface SpecialMeta {
  label: string;
  hue: number;
}

function detectSpecial(period: number): SpecialMeta | null {
  // Heuristic: mei → vakantiegeld, december → 13e maand
  // Echte specials komen uit Nmbrs (deferred PAYSLIP-SPECIALS-FROM-NMBRS).
  const monthIdx = (period - 1) % 12;
  if (monthIdx === 4) {
    return { label: "Vakantiegeld", hue: DOMAIN_HUES.sun };
  }
  if (monthIdx === 11) {
    return { label: "13e maand", hue: DOMAIN_HUES.harvest };
  }
  return null;
}

export interface PayslipHistoryProps {
  payslips: NmbrsPayslipSummary[];
}

export function PayslipHistory({ payslips }: PayslipHistoryProps) {
  if (payslips.length === 0) {
    return (
      <section>
        <HistoryHeader />
        <div
          className="rounded-2xl border p-8 text-center text-sm"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--fg-tertiary)",
          }}
        >
          Nog geen loonstroken in archief.
        </div>
      </section>
    );
  }

  const byYear = new Map<number, NmbrsPayslipSummary[]>();
  for (const p of payslips) {
    const list = byYear.get(p.year) ?? [];
    list.push(p);
    byYear.set(p.year, list);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b - a);

  return (
    <section>
      <HistoryHeader />
      <div className="space-y-8">
        {years.map((year) => {
          const slips = (byYear.get(year) ?? []).sort(
            (a, b) => b.period - a.period,
          );
          return (
            <div key={year}>
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="grid size-10 place-items-center rounded-full"
                  style={{
                    border: "2px solid var(--border-subtle)",
                    background: "var(--surface-card)",
                  }}
                >
                  <span
                    className="font-display tabular-nums"
                    style={{ fontSize: 14, fontWeight: 500 }}
                  >
                    &rsquo;{String(year).slice(2)}
                  </span>
                </div>
                <span
                  className="font-display italic"
                  style={{
                    fontSize: 22,
                    fontWeight: 500,
                    color: "var(--fg-secondary)",
                  }}
                >
                  {year}
                </span>
              </div>

              <div className="space-y-2">
                {slips.map((p) => {
                  const monthIdx = (p.period - 1) % 12;
                  const monthShort = MONTHS_NL_SHORT[monthIdx] ?? "—";
                  const special = detectSpecial(p.period);
                  return (
                    <div
                      key={`${p.year}-${p.period}`}
                      className="flex items-center gap-4 rounded-2xl border px-5 py-4"
                      style={{
                        borderColor: "var(--border-subtle)",
                        background: "var(--surface-card)",
                        borderLeftWidth: special ? 3 : 1,
                        borderLeftColor: special
                          ? oklchEmphasis(special.hue)
                          : "var(--border-subtle)",
                      }}
                    >
                      <div className="w-20">
                        <div
                          className="font-display"
                          style={{ fontSize: 20, fontWeight: 500 }}
                        >
                          {monthShort}
                        </div>
                        <div
                          className="mt-0.5 font-mono"
                          style={{
                            fontSize: 10,
                            color: "var(--fg-tertiary)",
                          }}
                        >
                          periode {p.period}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        {special ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono uppercase"
                            style={{
                              fontSize: 10,
                              letterSpacing: "0.08em",
                              background: oklchSubtleBg(special.hue),
                              color: oklchEmphasis(special.hue),
                            }}
                          >
                            ◆ {special.label}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--fg-tertiary)",
                            }}
                          >
                            Reguliere maand
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <div
                          className="font-mono uppercase"
                          style={{
                            fontSize: 9,
                            letterSpacing: "0.08em",
                            color: "var(--fg-tertiary)",
                          }}
                        >
                          bruto
                        </div>
                        <div
                          className="mt-0.5 font-display tabular-nums"
                          style={{ fontSize: 20, fontWeight: 500 }}
                        >
                          {formatEur(p.amountGrossCents)}
                        </div>
                      </div>

                      <Link
                        href={`/api/loonstroken/${p.year}/${p.period}`}
                        className="rounded-lg px-3 py-1.5 font-mono uppercase"
                        style={{
                          fontSize: 11,
                          letterSpacing: "0.08em",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--fg-secondary)",
                        }}
                      >
                        ↓ PDF
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HistoryHeader() {
  return (
    <div className="mb-5">
      <div
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
          color: "var(--fg-tertiary)",
        }}
      >
        Archief
      </div>
      <h2
        className="mt-1.5 font-display"
        style={{
          fontSize: 28,
          fontWeight: 500,
          color: "var(--fg-primary)",
        }}
      >
        Eerdere maanden
      </h2>
    </div>
  );
}
