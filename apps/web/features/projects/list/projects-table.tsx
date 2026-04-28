"use client";

import { ArrowUp, ArrowDown, MoreHorizontal } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { toast } from "sonner";

import { ProjectStatusBadge } from "./project-status-badge";

import type { ProjectListRow } from "@/app/(admin)/admin/projecten/queries";
import type { ProjectListPrefs } from "@/lib/list-prefs-cookie-shared-projects";

// ── Stub helpers ──────────────────────────────────────────────────────────────

/** Derive a stable pseudo-random number [0,1) from a string hash. */
function hashFrac(s: string, seed = 0): number {
  let h = seed * 2654435761;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/** Stub initials for up to 3 "assigned" employees from the project id. */
function stubInitials(projectId: string): string[] {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return [0, 1, 2].map((i) => {
    const a = alphabet[Math.floor(hashFrac(projectId, i * 7) * alphabet.length)];
    const b = alphabet[Math.floor(hashFrac(projectId, i * 13 + 3) * alphabet.length)];
    return `${a}${b}`;
  });
}

const INITIALS_COLORS = [
  "oklch(0.78 0.10 265)",
  "oklch(0.78 0.10 340)",
  "oklch(0.78 0.10 200)",
  "oklch(0.78 0.10 145)",
  "oklch(0.78 0.10 25)",
];

function initialsColor(idx: number): string {
  return INITIALS_COLORS[idx % INITIALS_COLORS.length] ?? "oklch(0.78 0.10 265)";
}

/** Stub hours: assignmentCount * 40 weeks proxy.
 * TODO 1.6: replace with real aggregation from hour_entries.
 */
function stubUren(row: ProjectListRow): number {
  return row.assignmentCount * 40;
}

/** Stub omzet: uren * €95.
 * TODO 1.6: replace with real aggregation from hour_entries.
 */
function stubOmzet(row: ProjectListRow): number {
  return stubUren(row) * 95;
}

/** Derive bureau from first word of project name.
 * TODO 1.1c: replace with real bureau field on projects.
 */
function stubBureau(row: ProjectListRow): string {
  const first = row.name.split(/[\s\-_]/)[0];
  return first && first.length > 2 ? first : "—";
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const NL = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];
  return `${String(d.getDate()).padStart(2, "0")} ${NL[d.getMonth()]} ${d.getFullYear()}`;
}

// ── SortableHeader ────────────────────────────────────────────────────────────

export function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: string;
  currentSort: string;
  currentDir: string;
  onSort: (key: string) => void;
}) {
  const active = currentSort === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-fg-primary"
      style={{ color: active ? "var(--fg-primary)" : "inherit" }}
    >
      {label}
      {active && (currentDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
    </button>
  );
}

// ── AvatarStack ───────────────────────────────────────────────────────────────

function AvatarStack({ projectId, count }: { projectId: string; count: number }) {
  const initials = stubInitials(projectId);
  const shown = Math.min(3, count);
  const extra = count - shown;
  return (
    <div className="flex items-center">
      {initials.slice(0, shown).map((ini, i) => (
        <div
          key={i}
          title={ini}
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: initialsColor(i),
            border: "1.5px solid var(--surface-base)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 8,
            fontWeight: 600,
            color: "#fff",
            marginLeft: i === 0 ? 0 : -6,
            zIndex: shown - i,
            position: "relative",
          }}
        >
          {ini}
        </div>
      ))}
      {extra > 0 && (
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "var(--surface-lift)",
            border: "1.5px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 8,
            fontWeight: 600,
            color: "var(--fg-tertiary)",
            marginLeft: -6,
            position: "relative",
          }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

// ── ProjectsTable ─────────────────────────────────────────────────────────────

interface ProjectsTableProps {
  rows: ProjectListRow[];
  prefs: ProjectListPrefs;
  selectedId: string | null;
  onSelectProject: (id: string | null) => void;
  currentSort: string;
  currentDir: string;
  onSort: (key: string) => void;
}

export function ProjectsTable({
  rows,
  prefs,
  selectedId,
  onSelectProject,
  currentSort,
  currentDir,
  onSort,
}: ProjectsTableProps) {
  const rowPad =
    prefs.density === "compact" ? "py-2" : prefs.density === "spacious" ? "py-4" : "py-3";

  return (
    <div
      className="overflow-hidden rounded-xl border glass-card"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            className="border-b text-xs uppercase tracking-wide"
            style={{ borderColor: "var(--border-subtle)", color: "var(--fg-tertiary)" }}
          >
            <th className="p-3 text-left font-medium">
              <SortableHeader
                label="Project"
                sortKey="name"
                currentSort={currentSort}
                currentDir={currentDir}
                onSort={onSort}
              />
            </th>
            <th className="p-3 text-left font-medium">Klant</th>
            {/* TODO 1.1c: Bureau-veld op projects-tabel — nu stub van project-naam */}
            {prefs.columns.bureau && <th className="p-3 text-left font-medium">Bureau</th>}
            {prefs.columns.status && <th className="p-3 text-left font-medium">Status</th>}
            {prefs.columns.looptijd && (
              <th className="p-3 text-left font-medium">
                <SortableHeader
                  label="Looptijd"
                  sortKey="start"
                  currentSort={currentSort}
                  currentDir={currentDir}
                  onSort={onSort}
                />
              </th>
            )}
            {/* TODO 1.6: Uren/Omzet van echte aggregatie uit hour_entries */}
            {prefs.columns.uren && (
              <th className="p-3 text-right font-medium">Uren</th>
            )}
            {prefs.columns.omzet && (
              <th className="p-3 text-right font-medium">Omzet</th>
            )}
            {prefs.showAvatars && (
              <th className="p-3 text-left font-medium">Team</th>
            )}
            <th className="w-10 p-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const selected = selectedId === p.id;
            return (
              <tr
                key={p.id}
                onClick={() => onSelectProject(selected ? null : p.id)}
                className="cursor-pointer border-b transition-colors last:border-0"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: selected ? "var(--surface-lift)" : "transparent",
                  boxShadow: selected
                    ? "inset 0 0 0 1px color-mix(in oklch, var(--aurora-violet) 30%, transparent)"
                    : "none",
                }}
              >
                <td className={`pl-3 pr-3 ${rowPad}`}>
                  <Link
                    href={`/admin/projecten/${p.id}` as Route}
                    className="font-display hover:underline"
                    style={{ fontSize: "1rem", lineHeight: 1.2 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <em style={{ fontWeight: 400 }}>{p.name}</em>
                  </Link>
                </td>
                <td className={`p-3 ${rowPad}`}>
                  <span className="font-mono text-[11px] uppercase tracking-wider" style={{ color: "var(--fg-tertiary)" }}>
                    {p.clientName}
                  </span>
                </td>
                {prefs.columns.bureau && (
                  <td className={`p-3 ${rowPad}`} style={{ color: "var(--fg-secondary)" }}>
                    {stubBureau(p)}
                  </td>
                )}
                {prefs.columns.status && (
                  <td className={`p-3 ${rowPad}`}>
                    <ProjectStatusBadge status={p.status} />
                  </td>
                )}
                {prefs.columns.looptijd && (
                  <td className={`p-3 font-mono text-xs tabular-nums ${rowPad}`} style={{ color: "var(--fg-secondary)" }}>
                    {fmtDate(p.startDate)}
                    {p.startDate && p.endDate ? " → " : ""}
                    {p.endDate ? fmtDate(p.endDate) : ""}
                  </td>
                )}
                {prefs.columns.uren && (
                  <td className={`p-3 text-right font-mono tabular-nums ${rowPad}`} style={{ color: "var(--fg-secondary)" }}>
                    {stubUren(p)}u
                  </td>
                )}
                {prefs.columns.omzet && (
                  <td className={`p-3 text-right font-mono tabular-nums ${rowPad}`} style={{ color: "var(--fg-secondary)" }}>
                    {fmtOmzet(stubOmzet(p))}
                  </td>
                )}
                {prefs.showAvatars && (
                  <td className={`p-3 ${rowPad}`}>
                    <AvatarStack projectId={p.id} count={p.assignmentCount} />
                  </td>
                )}
                <td className={`p-3 ${rowPad}`}>
                  <div
                    className="flex items-center justify-end gap-1"
                    style={{ opacity: selected ? 1 : 0.2 }}
                  >
                    <button
                      className="rounded p-1 transition-colors hover:bg-surface-base"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info("Acties volgt later");
                      }}
                      aria-label="Meer opties"
                    >
                      <MoreHorizontal size={16} style={{ color: "var(--fg-secondary)" }} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {rows.length === 0 && (
        <div className="flex flex-col items-center gap-3 p-12 text-center">
          <p className="font-display" style={{ fontSize: "var(--text-title)" }}>
            Niets <em>gevonden</em>
          </p>
          <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
            Pas je filter aan of ruim je zoekopdracht op.
          </p>
        </div>
      )}
    </div>
  );
}

function fmtOmzet(n: number): string {
  if (n >= 1000000) return `€${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `€${(n / 1000).toFixed(0)}k`;
  return `€${n}`;
}
