import Link from "next/link";

export interface ContractTimelineItem {
  id: string;
  startDate: string;
  endDate: string | null;
  jobTitle: string;
  brutoSalarisMaandCents: string | null;
  pdfStoragePath: string;
}

function formatEur(centsStr: string | null) {
  if (!centsStr) return null;
  const cents = parseFloat(centsStr);
  if (Number.isNaN(cents)) return null;
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function ContractTimeline({ items }: { items: ContractTimelineItem[] }) {
  if (items.length === 0) {
    return (
      <div
        className="rounded-xl border p-8 text-center text-sm"
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
    <div className="space-y-4">
      {items.map((item, idx) => {
        const isActive = !item.endDate;
        const salaris = formatEur(item.brutoSalarisMaandCents);
        return (
          <div
            key={item.id}
            className="rounded-xl border p-5"
            style={{
              borderColor: isActive ? "var(--aurora-violet)" : "var(--border-subtle)",
              backgroundColor: "var(--surface-card)",
            }}
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    className="font-semibold"
                    style={{ color: "var(--fg-primary)" }}
                  >
                    {item.jobTitle}
                  </h3>
                  {isActive && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: "rgba(139, 92, 246, 0.15)",
                        color: "var(--aurora-violet)",
                      }}
                    >
                      Actief
                    </span>
                  )}
                  {idx === 0 && !isActive && (
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: "rgba(148, 163, 184, 0.15)",
                        color: "var(--fg-tertiary)",
                      }}
                    >
                      Verlopen
                    </span>
                  )}
                </div>
                <p
                  className="mt-0.5 text-sm"
                  style={{ color: "var(--fg-secondary)" }}
                >
                  {item.startDate} – {item.endDate ?? "heden"}
                </p>
              </div>
              <Link
                href={`/api/contract/${item.id}/download`}
                target="_blank"
                rel="noopener"
                className="shrink-0 rounded-lg border px-3 py-1.5 text-sm transition-colors"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--fg-secondary)",
                }}
              >
                Download PDF
              </Link>
            </div>
            {salaris && (
              <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
                Bruto salaris: <span style={{ color: "var(--fg-primary)" }}>{salaris} / maand</span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
