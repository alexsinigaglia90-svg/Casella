"use client";

import type { ProjectStatus } from "@casella/types";
import { Search } from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { ProjectChartsPanel } from "./project-charts-panel";
import { ProjectListTweaksDock } from "./project-list-tweaks-dock";
import { ProjectsTable } from "./projects-table";

import type {
  ProjectListRow,
  ProjectStatusCounts,
} from "@/app/(admin)/admin/projecten/queries";
import { PassportStat } from "@/components/design";
import type { ProjectListPrefs } from "@/lib/list-prefs-cookie-shared-projects";
import { useProjectListPrefs } from "@/lib/use-project-list-prefs";

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
  initialPrefs: ProjectListPrefs;
}

function countFor(counts: ProjectStatusCounts, key: (typeof STATUS_TABS)[number]["key"]): number {
  if (key === "all") return counts.all;
  return counts[key as ProjectStatus];
}

export function ProjectsListShell({
  rows,
  counts,
  nextCursor: _nextCursor,
  currentQuery,
  currentStatus,
  currentSort,
  currentDir,
  initialPrefs,
}: ProjectsListShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { prefs, setPrefs } = useProjectListPrefs(initialPrefs);

  const [searchValue, setSearchValue] = useState(currentQuery);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  function handleSelectProject(id: string | null) {
    setSelectedId(id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-4">
        <div>
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
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider" style={{ color: "var(--fg-tertiary)" }}>
            PORTFOLIO · {counts.active} actief
          </p>
        </div>
        {/* PassportStat-trio */}
        <div className="flex flex-wrap gap-8">
          <PassportStat
            label="Actief"
            value={String(counts.active)}
            sub="lopende projecten"
          />
          <PassportStat
            label="Gepland"
            value={String(counts.planned)}
            sub="aankomend"
          />
          <PassportStat
            label="Voltooid"
            value={String(counts.completed)}
            sub="afgerond"
          />
        </div>
      </header>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="relative flex h-9 min-w-[260px] flex-1 items-center gap-2 rounded-md border px-3"
          style={{ borderColor: "var(--border-subtle)", background: "var(--surface-lift)" }}
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
            style={{ borderColor: "var(--border-subtle)", color: "var(--fg-tertiary)" }}
          >
            ⌘K
          </kbd>
        </div>

        <div
          className="flex items-center gap-1 rounded-md border p-1"
          style={{ borderColor: "var(--border-subtle)", background: "var(--surface-lift)" }}
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
                  style={{ background: "var(--ink-5, rgba(0,0,0,0.06))", color: "var(--fg-tertiary)" }}
                >
                  {countFor(counts, f.key)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Split-view: table left, charts right */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_420px]">
        {/* Left: table */}
        <div className="min-w-0">
          <ProjectsTable
            rows={rows}
            prefs={prefs}
            selectedId={selectedId}
            onSelectProject={handleSelectProject}
            currentSort={currentSort}
            currentDir={currentDir}
            onSort={handleSort}
          />

          {/* Footer */}
          <div
            className="mt-3 flex items-center justify-between text-xs"
            style={{ color: "var(--fg-tertiary)" }}
          >
            <span>Toont {rows.length} · sorteer op {currentSort}</span>
            <span className="font-mono">⌘K om te zoeken · N voor nieuw</span>
          </div>
        </div>

        {/* Right: sticky chart panel */}
        <div className="hidden md:block">
          <div style={{ position: "sticky", top: "6rem" }}>
            <ProjectChartsPanel
              rows={rows}
              selectedId={selectedId}
              prefs={prefs}
            />
          </div>
        </div>
      </div>

      {/* Tweaks dock */}
      <ProjectListTweaksDock prefs={prefs} onChange={setPrefs} />
    </div>
  );
}
