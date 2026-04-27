import { Inbox } from "lucide-react";

import type { NmbrsSyncRunRow } from "@/lib/nmbrs/queries";

interface SyncRunsTableProps {
  rows: NmbrsSyncRunRow[];
}

const TYPE_LABEL: Record<NmbrsSyncRunRow["syncType"], string> = {
  employees: "Medewerkers",
  hours: "Uren",
  leave: "Verlof",
};

const STATUS_LABEL: Record<NmbrsSyncRunRow["status"], string> = {
  running: "Bezig",
  success: "Succesvol",
  failure: "Mislukt",
};

const STATUS_COLOR: Record<NmbrsSyncRunRow["status"], string> = {
  running: "var(--aurora-violet)",
  success: "var(--success-fg, #16a34a)",
  failure: "var(--danger-fg, #dc2626)",
};

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}:${mi}`;
}

function fmtDuration(startIso: string, endIso: string | null): string {
  if (!endIso) return "—";
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.floor((ms % 60_000) / 1000);
  return `${mins}m ${secs}s`;
}

export function SyncRunsTable({ rows }: SyncRunsTableProps) {
  if (rows.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-xl border p-12 text-center glass-card"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <Inbox size={26} style={{ color: "var(--fg-tertiary)" }} aria-hidden />
        <p style={{ color: "var(--fg-secondary)" }}>
          Nog geen sync-runs uitgevoerd.
        </p>
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border glass-card"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-left"
            style={{
              color: "var(--fg-tertiary)",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <th className="px-4 py-2 font-mono text-[11px] uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-2 font-mono text-[11px] uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-2 font-mono text-[11px] uppercase tracking-wider">
              Gestart
            </th>
            <th className="px-4 py-2 font-mono text-[11px] uppercase tracking-wider">
              Duur
            </th>
            <th className="px-4 py-2 text-right font-mono text-[11px] uppercase tracking-wider">
              Verwerkt
            </th>
            <th className="px-4 py-2 text-right font-mono text-[11px] uppercase tracking-wider">
              Geslaagd
            </th>
            <th className="px-4 py-2 text-right font-mono text-[11px] uppercase tracking-wider">
              Mislukt
            </th>
            <th className="px-4 py-2 font-mono text-[11px] uppercase tracking-wider">
              Foutmelding
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              style={{
                borderBottom: "1px solid var(--border-subtle)",
                color: "var(--fg-primary)",
              }}
            >
              <td className="px-4 py-2">{TYPE_LABEL[r.syncType]}</td>
              <td className="px-4 py-2">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    color: STATUS_COLOR[r.status],
                    backgroundColor: `color-mix(in oklab, ${STATUS_COLOR[r.status]} 14%, transparent)`,
                  }}
                >
                  {STATUS_LABEL[r.status]}
                </span>
              </td>
              <td
                className="px-4 py-2 tabular-nums"
                style={{ color: "var(--fg-secondary)" }}
              >
                {fmtDateTime(r.startedAt)}
              </td>
              <td
                className="px-4 py-2 tabular-nums"
                style={{ color: "var(--fg-secondary)" }}
              >
                {fmtDuration(r.startedAt, r.finishedAt)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">
                {r.recordsProcessed}
              </td>
              <td
                className="px-4 py-2 text-right tabular-nums"
                style={{ color: "var(--success-fg, #16a34a)" }}
              >
                {r.recordsSucceeded}
              </td>
              <td
                className="px-4 py-2 text-right tabular-nums"
                style={{
                  color:
                    r.recordsFailed > 0
                      ? "var(--danger-fg, #dc2626)"
                      : "var(--fg-tertiary)",
                }}
              >
                {r.recordsFailed}
              </td>
              <td
                className="max-w-xs truncate px-4 py-2"
                style={{ color: "var(--fg-secondary)" }}
                title={r.errorMessage ?? undefined}
              >
                {r.errorMessage ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
