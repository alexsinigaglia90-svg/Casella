import Link from "next/link";

export interface StatementListItem {
  id: string;
  purpose: "mortgage" | "rent" | "other";
  status: "requested" | "generated" | "signed" | "delivered" | "cancelled";
  requestedAt: string;
}

const PURPOSE_LABELS: Record<StatementListItem["purpose"], string> = {
  mortgage: "Hypotheek",
  rent: "Huur",
  other: "Anders",
};

const STATUS_LABELS: Record<StatementListItem["status"], string> = {
  requested: "Aangevraagd",
  generated: "Gegenereerd",
  signed: "Ondertekend",
  delivered: "Klaar",
  cancelled: "Geannuleerd",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function StatementList({ items }: { items: StatementListItem[] }) {
  if (items.length === 0) {
    return (
      <div
        className="rounded-xl border p-6 text-center text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--fg-tertiary)",
        }}
      >
        Nog geen werkgeversverklaringen.
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
              Datum
            </th>
            <th
              className="px-4 py-2 text-left font-medium"
              style={{ color: "var(--fg-secondary)" }}
            >
              Doel
            </th>
            <th
              className="px-4 py-2 text-left font-medium"
              style={{ color: "var(--fg-secondary)" }}
            >
              Status
            </th>
            <th
              className="px-4 py-2 text-right font-medium"
              style={{ color: "var(--fg-secondary)" }}
            >
              Download
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr
              key={it.id}
              className="border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <td className="px-4 py-2" style={{ color: "var(--fg-primary)" }}>
                {formatDate(it.requestedAt)}
              </td>
              <td
                className="px-4 py-2"
                style={{ color: "var(--fg-secondary)" }}
              >
                {PURPOSE_LABELS[it.purpose]}
              </td>
              <td
                className="px-4 py-2"
                style={{ color: "var(--fg-secondary)" }}
              >
                {STATUS_LABELS[it.status]}
              </td>
              <td className="px-4 py-2 text-right">
                <Link
                  href={`/api/werkgeversverklaring/${it.id}/download`}
                  className="rounded-md border px-2 py-1 text-xs"
                  style={{
                    borderColor: "var(--border-subtle)",
                    color: "var(--fg-secondary)",
                  }}
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
