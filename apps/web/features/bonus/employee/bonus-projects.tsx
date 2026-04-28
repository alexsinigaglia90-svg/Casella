import type { BonusHistoryRow } from "./bonus-history";

import { DOMAIN_HUES, oklchEmphasis, oklchSubtleBg } from "@/lib/design/oklch";

const TYPE_META: Record<
  BonusHistoryRow["type"],
  { label: string; hue: number }
> = {
  accrual: { label: "Opbouw", hue: DOMAIN_HUES.sun },
  adjustment: { label: "Correctie", hue: DOMAIN_HUES.cool },
  payout: { label: "Uitbetaling", hue: DOMAIN_HUES.harvest },
};

function fmtEur(cents: number): string {
  const sign = cents < 0 ? "−" : "";
  const abs = Math.abs(cents);
  return `${sign}€ ${(abs / 100).toFixed(2).replace(".", ",")}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

interface ProjectGroup {
  projectName: string | null;
  rows: BonusHistoryRow[];
  totalCents: number;
  hue: number;
}

function groupByProject(rows: BonusHistoryRow[]): ProjectGroup[] {
  const map = new Map<string, ProjectGroup>();
  // Stable hue assignment per project — cycle through domain hues
  const hueCycle = [
    DOMAIN_HUES.cloud,
    DOMAIN_HUES.sun,
    DOMAIN_HUES.harvest,
    DOMAIN_HUES.cool,
    DOMAIN_HUES.spark,
    DOMAIN_HUES.warm,
  ];
  let hueIdx = 0;
  for (const r of rows) {
    const key = r.projectName ?? "__intern__";
    let g = map.get(key);
    if (!g) {
      g = {
        projectName: r.projectName,
        rows: [],
        totalCents: 0,
        hue: hueCycle[hueIdx % hueCycle.length] ?? DOMAIN_HUES.cloud,
      };
      hueIdx++;
      map.set(key, g);
    }
    g.rows.push(r);
    g.totalCents += r.amountCents;
  }
  return Array.from(map.values()).sort(
    (a, b) => Math.abs(b.totalCents) - Math.abs(a.totalCents),
  );
}

export interface BonusProjectsProps {
  rows: BonusHistoryRow[];
}

export function BonusProjects({ rows }: BonusProjectsProps) {
  if (rows.length === 0) {
    return (
      <section>
        <SectionHeader />
        <div
          className="rounded-2xl border p-8 text-center text-sm"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--fg-tertiary)",
          }}
        >
          Nog geen bonus-records in dit jaar.
        </div>
      </section>
    );
  }

  const groups = groupByProject(rows);

  return (
    <section>
      <SectionHeader />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {groups.map((g, i) => (
          <article
            key={`${g.projectName ?? "intern"}-${i}`}
            className="overflow-hidden rounded-2xl border"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface-card)",
            }}
          >
            <div
              className="h-1"
              style={{ background: oklchEmphasis(g.hue) }}
            />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div
                    className="font-mono uppercase"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      color: oklchEmphasis(g.hue),
                    }}
                  >
                    {g.projectName ? "Project" : "Intern Casella"}
                  </div>
                  <h3
                    className="mt-1 font-display"
                    style={{
                      fontSize: 20,
                      fontWeight: 500,
                      color: "var(--fg-primary)",
                    }}
                  >
                    {g.projectName ?? "Niet aan project gekoppeld"}
                  </h3>
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
                    totaal
                  </div>
                  <div
                    className="mt-0.5 font-display tabular-nums"
                    style={{ fontSize: 28, fontWeight: 500 }}
                  >
                    {fmtEur(g.totalCents)}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {g.rows.slice(0, 5).map((row) => {
                  const meta = TYPE_META[row.type];
                  return (
                    <div
                      key={row.id}
                      className="flex items-center gap-3"
                      style={{ fontSize: 12 }}
                    >
                      <span
                        className="rounded-full px-2 py-0.5 font-mono uppercase"
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.08em",
                          background: oklchSubtleBg(meta.hue),
                          color: oklchEmphasis(meta.hue),
                        }}
                      >
                        {meta.label}
                      </span>
                      <span style={{ color: "var(--fg-secondary)" }}>
                        {row.period}
                      </span>
                      <span
                        className="font-mono"
                        style={{ color: "var(--fg-tertiary)", fontSize: 11 }}
                      >
                        {fmtDate(row.createdAt)}
                      </span>
                      <span className="ml-auto font-mono tabular-nums">
                        {fmtEur(row.amountCents)}
                      </span>
                    </div>
                  );
                })}
                {g.rows.length > 5 && (
                  <div
                    className="font-mono uppercase"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      color: "var(--fg-tertiary)",
                    }}
                  >
                    +{g.rows.length - 5} meer
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SectionHeader() {
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
        Per project
      </div>
      <h2
        className="mt-1.5 font-display"
        style={{
          fontSize: 28,
          fontWeight: 500,
          color: "var(--fg-primary)",
        }}
      >
        Bonus-historie
      </h2>
    </div>
  );
}
