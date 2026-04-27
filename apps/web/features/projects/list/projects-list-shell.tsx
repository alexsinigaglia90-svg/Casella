"use client";

import type { ProjectStatus } from "@casella/types";
import { Search, ArrowUp, ArrowDown, MoreHorizontal } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { ProjectStatusBadge } from "./project-status-badge";

import type {
  ProjectListRow,
  ProjectStatusCounts,
} from "@/app/(admin)/admin/projecten/queries";

const STATUS_TABS = [
  { key: "all", label: "Alle" },
  { key: "planned", label: "Gepland" },
  { key: "active", label: "Actief" },
  { key: "completed", label: "Voltooid" },
  { key: "cancelled", label: "Geannuleerd" },
] as const;

interface ProjectsListShellProps {
  rows: ProjectListRow[];
  counts: ProjectStatusCounts;
  nextCursor: string | null;
  currentQuery: string;
  currentStatus: string;
  currentSort: string;
  currentDir: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return iso;
}

export function ProjectsListShell({
  rows,
  counts,
  nextCursor: _nextCursor,
  currentQuery,
  currentStatus,
  currentSort,
  currentDir,
}: ProjectsListShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [searchValue, setSearchValue] = useState(currentQuery);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "" || (key === "status" && value === "all")) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    if (key !== "cursor") params.delete("cursor");
    router.replace(`${pathname}?${params.toString()}` as Route);
  }

  // Debounce search → URL
  useEffect(() => {
    const id = setTimeout(() => {
      updateParam("q", searchValue || null);
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  function handleSort(key: string) {
    if (currentSort === key) {
      updateParam("dir", currentDir === "asc" ? "desc" : "asc");
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set("sort", key);
      params.set("dir", "asc");
      params.delete("cursor");
      router.replace(`${pathname}?${params.toString()}` as Route);
    }
  }

  function countFor(key: (typeof STATUS_TABS)[number]["key"]): number {
    if (key === "all") return counts.all;
    return counts[key as ProjectStatus];
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <div
          className="mb-1 font-mono text-[11px] uppercase tracking-wider"
          style={{ color: "var(--fg-tertiary)" }}
        >
          Admin
        </div>
        <h1 className="font-display text-display leading-none">
          <span>Projec</span>
          <em>ten</em>
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--fg-secondary)" }}>
          {rows.length} van {counts.all} · laatste synchronisatie zojuist
        </p>
      </header>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="relative flex h-9 min-w-[260px] flex-1 items-center gap-2 rounded-md border px-3"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--surface-lift)",
          }}
        >
          <Search size={14} style={{ color: "var(--fg-tertiary)", flexShrink: 0 }} />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Zoek op naam of omschrijving…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-fg-tertiary"
          />
          <kbd
            className="rounded border px-1.5 py-0.5 font-mono text-[10px]"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--fg-tertiary)",
            }}
          >
            ⌘K
          </kbd>
        </div>

        <div
          className="flex items-center gap-1 rounded-md border p-1"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--surface-lift)",
          }}
        >
          {STATUS_TABS.map((f) => {
            const on = currentStatus === f.key;
            return (
              <button
                key={f.key}
                onClick={() => updateParam("status", f.key)}
                className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors"
                style={{
                  background: on ? "var(--surface-base)" : "transparent",
                  color: on ? "var(--fg-primary)" : "var(--fg-secondary)",
                  boxShadow: on ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
                }}
              >
                {f.label}
                <span
                  className="rounded-full px-1.5 font-mono text-[10px]"
                  style={{
                    background: "var(--ink-5, rgba(0,0,0,0.06))",
                    color: "var(--fg-tertiary)",
                  }}
                >
                  {countFor(f.key)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-xl border glass-card"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b text-xs uppercase tracking-wide"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--fg-tertiary)",
              }}
            >
              <th className="p-3 text-left font-medium">
                <SortableHeader
                  label="Naam"
                  sortKey="name"
                  currentSort={currentSort}
                  currentDir={currentDir}
                  onSort={handleSort}
                />
              </th>
              <th className="p-3 text-left font-medium">Klant</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-left font-medium">
                <SortableHeader
                  label="Start"
                  sortKey="start"
                  currentSort={currentSort}
                  currentDir={currentDir}
                  onSort={handleSort}
                />
              </th>
              <th className="p-3 text-left font-medium">Eind</th>
              <th className="p-3 text-right font-medium">Toewijzingen</th>
              <th className="w-10 p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const hov = hoveredId === p.id;
              return (
                <tr
                  key={p.id}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="cursor-pointer border-b transition-colors last:border-0"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background: hov ? "var(--surface-lift)" : "transparent",
                  }}
                >
                  <td className="pl-3 pr-3 py-3">
                    <Link
                      href={`/admin/projecten/${p.id}` as Route}
                      className="font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="p-3" style={{ color: "var(--fg-secondary)" }}>
                    {p.clientName}
                  </td>
                  <td className="p-3">
                    <ProjectStatusBadge status={p.status} />
                  </td>
                  <td
                    className="p-3 font-mono text-xs"
                    style={{ color: "var(--fg-secondary)" }}
                  >
                    {fmtDate(p.startDate)}
                  </td>
                  <td
                    className="p-3 font-mono text-xs"
                    style={{ color: "var(--fg-secondary)" }}
                  >
                    {fmtDate(p.endDate)}
                  </td>
                  <td
                    className="p-3 text-right font-mono tabular-nums"
                    style={{ color: "var(--fg-secondary)" }}
                  >
                    {p.assignmentCount}
                  </td>
                  <td className="p-3">
                    <div
                      className="flex items-center justify-end gap-1"
                      style={{ opacity: hov ? 1 : 0.2 }}
                    >
                      <button
                        className="rounded p-1 transition-colors hover:bg-surface-base"
                        onClick={() => toast.info("Acties volgt later")}
                        aria-label="Meer opties"
                      >
                        <MoreHorizontal
                          size={16}
                          style={{ color: "var(--fg-secondary)" }}
                        />
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

      {/* Footer line */}
      <div
        className="flex items-center justify-between text-xs"
        style={{ color: "var(--fg-tertiary)" }}
      >
        <span>
          Toont {rows.length} · sorteer op {currentSort}
        </span>
        <span className="font-mono">⌘K om te zoeken · N voor nieuw</span>
      </div>
    </div>
  );
}

function SortableHeader({
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
      {active &&
        (currentDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
    </button>
  );
}
