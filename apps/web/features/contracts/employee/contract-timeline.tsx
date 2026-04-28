import Link from "next/link";

import { DOMAIN_HUES, oklchEmphasis, oklchSubtleBg } from "@/lib/design/oklch";

const MONTHS_NL_SHORT = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

function fmtMonthShort(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS_NL_SHORT[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

function formatEur(centsStr: string | null) {
  if (!centsStr) return null;
  const cents = parseFloat(centsStr);
  if (Number.isNaN(cents)) return null;
  return `€ ${(cents / 100).toFixed(0)}`;
}

export interface ContractTimelineItem {
  id: string;
  startDate: string;
  endDate: string | null;
  jobTitle: string;
  brutoSalarisMaandCents: string | null;
  pdfStoragePath: string;
}

export function ContractTimeline({ items }: { items: ContractTimelineItem[] }) {
  if (items.length === 0) {
    return (
      <div
        className="rounded-2xl border p-8 text-center text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--fg-tertiary)",
        }}
      >
        Geen contracten gevonden.
      </div>
    );
  }

  return (
    <section>
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
          Eerdere versies
        </h2>
      </div>
      <div
        className="overflow-hidden rounded-2xl border"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-card)",
        }}
      >
        {items.map((item, idx) => {
          const isActive = !item.endDate;
          const hue = isActive ? DOMAIN_HUES.harvest : DOMAIN_HUES.sun;
          const salaris = formatEur(item.brutoSalarisMaandCents);
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 px-5 py-4"
              style={{
                borderTop: idx > 0 ? "1px solid var(--border-subtle)" : "none",
              }}
            >
              <div
                className="grid size-10 place-items-center rounded-lg"
                style={{
                  background: oklchSubtleBg(hue),
                  color: oklchEmphasis(hue),
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {isActive ? "✓" : "·"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className="font-display"
                    style={{
                      fontSize: 18,
                      fontWeight: 500,
                      color: "var(--fg-primary)",
                    }}
                  >
                    {item.jobTitle}
                  </h3>
                  {isActive && (
                    <span
                      className="rounded-full px-1.5 py-0.5 font-mono uppercase"
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.1em",
                        background: oklchSubtleBg(DOMAIN_HUES.harvest),
                        color: oklchEmphasis(DOMAIN_HUES.harvest),
                      }}
                    >
                      Actief
                    </span>
                  )}
                </div>
                <div
                  className="mt-1 font-mono"
                  style={{ fontSize: 11, color: "var(--fg-tertiary)" }}
                >
                  {fmtMonthShort(item.startDate)}
                  {item.endDate ? ` — ${fmtMonthShort(item.endDate)}` : " — heden"}
                  {salaris && (
                    <>
                      {" · "}
                      <span style={{ color: "var(--fg-secondary)" }}>
                        {salaris} bruto/mnd
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Link
                href={`/api/contract/${item.id}/download`}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono uppercase"
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
    </section>
  );
}
