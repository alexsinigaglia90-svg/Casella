"use client";

import { Search } from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { AssignmentsTimeline } from "./timeline/assignments-timeline";
import { AssignmentsTweaksDock } from "./timeline/assignments-tweaks-dock";

import type {
  AssignmentFilter,
  AssignmentListRow,
  AssignmentStatusCounts,
} from "@/app/(admin)/admin/toewijzingen/queries";
import type { AssignmentsListPrefs } from "@/lib/list-prefs-cookie-shared-assignments";
import { useAssignmentsListPrefs } from "@/lib/use-assignments-list-prefs";

const FILTER_TABS = [
  { key: "current", label: "Lopend" },
  { key: "past", label: "Afgelopen" },
  { key: "future", label: "Toekomstig" },
  { key: "all", label: "Alle" },
] as const satisfies ReadonlyArray<{ key: AssignmentFilter; label: string }>;

interface AssignmentsListShellProps {
  rows: AssignmentListRow[];
  counts: AssignmentStatusCounts;
  nextCursor: string | null;
  currentQuery: string;
  currentFilter: AssignmentFilter;
  currentSort: string;
  currentDir: string;
  initialPrefs: AssignmentsListPrefs;
}

export function AssignmentsListShell({
  rows,
  counts,
  nextCursor: _nextCursor,
  currentQuery,
  currentFilter,
  currentSort: _currentSort,
  currentDir: _currentDir,
  initialPrefs,
}: AssignmentsListShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { prefs, setPrefs } = useAssignmentsListPrefs(initialPrefs);

  const [searchValue, setSearchValue] = useState(currentQuery);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "") {
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

  function countFor(key: AssignmentFilter): number {
    return counts[key];
  }

  // Stat-row metrics: active assignment count, distinct employees with at
  // least one block, distinct projects with at least one block.
  const employeesUtilized = new Set(rows.map((r) => r.employeeId)).size;
  const projectsWithTeam = new Set(rows.map((r) => r.projectId)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-7">
          <div
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "var(--fg-tertiary)",
            }}
          >
            Admin · planning · magnetic timeline
          </div>
          <h1
            className="mt-3 font-display"
            style={{
              fontSize: "clamp(2.4rem, 3vw, 3.5rem)",
              fontWeight: 500,
              lineHeight: 0.95,
              color: "var(--fg-primary)",
            }}
          >
            <em>Toewijzingen</em>
          </h1>
          <p
            className="mt-3 max-w-xl text-sm"
            style={{ color: "var(--fg-secondary)" }}
          >
            {rows.length} van {counts.all} zichtbaar · sleep blokken om te
            plannen, gebruik pijltjes voor fijn-verschuiven.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 md:col-span-5">
          <StatBox label="Lopend" value={counts.current} />
          <StatBox label="Mensen ingezet" value={employeesUtilized} />
          <StatBox label="Projecten" value={projectsWithTeam} />
        </div>
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
            placeholder="Zoek op medewerker, project of klant…"
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
          {FILTER_TABS.map((f) => {
            const on = currentFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => updateParam("filter", f.key)}
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

      {/* Timeline */}
      <AssignmentsTimeline
        assignments={rows}
        axis={prefs.axis}
        horizon={prefs.horizon}
        palette={prefs.palette}
        showCapBar={prefs.showCapBar}
        showGhost={prefs.showGhost}
        showRevenue={prefs.showRevenue}
        magnetic={prefs.magnetic}
      />

      {/* Footer */}
      <div
        className="flex items-center justify-between text-xs"
        style={{ color: "var(--fg-tertiary)" }}
      >
        <span>
          {rows.length} toewijzingen · {prefs.axis === "people" ? "per mens" : "per project"} ·{" "}
          {prefs.horizon === "week"
            ? "6 weken"
            : prefs.horizon === "month"
              ? "16 weken"
              : "28 weken"}
        </span>
        <span className="font-mono">⌘K om te zoeken · N voor nieuw · ←/→ om te shiften</span>
      </div>

      {/* Tweaks dock */}
      <AssignmentsTweaksDock prefs={prefs} onChange={setPrefs} />
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-2xl border px-4 py-3"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--surface-card)",
      }}
    >
      <div
        className="font-mono uppercase"
        style={{
          fontSize: 9,
          letterSpacing: "0.18em",
          color: "var(--fg-tertiary)",
        }}
      >
        {label}
      </div>
      <div
        className="mt-1 font-display tabular-nums leading-none"
        style={{
          fontSize: 28,
          fontWeight: 500,
          color: "var(--fg-primary)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
