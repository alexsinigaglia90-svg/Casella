"use client";

import type { HourEntryEnriched } from "@casella/types";
import { AlertCircle, Check, Copy, MessageSquare, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  addDays,
  formatDateIso,
  formatHoursNl,
  formatWeekRangeLabel,
  getWeekDays,
} from "./date-utils";
import { SavedIndicator } from "./saved-indicator";
import { cellKey, useWeekState, type CellState } from "./use-week-state";
import { WeekPicker } from "./week-picker";

import { NoAssignmentsEmptyState } from "@/app/(authed)/uren/empty-state";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface WeekGridProject {
  id: string;
  name: string;
  clientName: string | null;
}

export type WeekStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "mixed"
  | "empty";

interface WeekGridProps {
  weekStart: string;
  initialEntries: HourEntryEnriched[];
  projects: WeekGridProject[];
  status: WeekStatus;
  rejectionReason: string | null;
}

const STATUS_LABELS: Record<WeekStatus, string> = {
  empty: "Leeg",
  draft: "Concept",
  submitted: "Wacht op goedkeuring",
  approved: "Goedgekeurd",
  rejected: "Afgewezen",
  mixed: "Gemengd",
};

const STATUS_COLORS: Record<WeekStatus, { bg: string; fg: string }> = {
  empty: { bg: "var(--surface-lift)", fg: "var(--fg-tertiary)" },
  draft: { bg: "var(--surface-lift)", fg: "var(--fg-secondary)" },
  submitted: { bg: "rgba(245,197,92,0.12)", fg: "var(--status-warning)" },
  approved: { bg: "rgba(61,216,168,0.12)", fg: "var(--status-success)" },
  rejected: { bg: "rgba(255,90,138,0.12)", fg: "var(--status-danger)" },
  mixed: { bg: "var(--surface-lift)", fg: "var(--fg-secondary)" },
};

export function WeekGrid({
  weekStart,
  initialEntries,
  projects,
  status,
  rejectionReason,
}: WeekGridProps) {
  const router = useRouter();
  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const rangeLabel = useMemo(() => formatWeekRangeLabel(weekStart), [weekStart]);

  // submitted/approved → fully read-only. rejected → editable (any edit
  // re-creates draft entries via the PUT handler since it deletes drafts only).
  const readOnly = status === "submitted" || status === "approved";

  const { cells, setCell, saveStatus, isDirty, saveNow } = useWeekState({
    weekStart,
    initialEntries,
    enabled: !readOnly,
  });

  const [submitting, setSubmitting] = useState(false);
  const [filling, setFilling] = useState(false);

  const isWeekEmpty = initialEntries.length === 0;

  async function handleFillFromPrevWeek() {
    if (filling) return;
    setFilling(true);
    try {
      const prevWeekIso = formatDateIso(addDays(new Date(weekStart), -7));
      const res = await fetch(
        `/api/uren/template?prevWeek=${encodeURIComponent(prevWeekIso)}`,
      );
      if (!res.ok) {
        toast.error("Vorige week niet kunnen ophalen");
        return;
      }
      const body = (await res.json()) as {
        entries: {
          projectId: string;
          workDate: string;
          hours: number;
          notes: string | null;
        }[];
      };
      if (body.entries.length === 0) {
        toast.info("Vorige week is leeg — niets om te kopiëren");
        return;
      }

      // Map prev-week dates → current-week dates by day-of-week offset.
      const prevStart = new Date(prevWeekIso);
      const curStart = new Date(weekStart);
      let copied = 0;
      for (const entry of body.entries) {
        const entryDate = new Date(entry.workDate);
        const dayOffset = Math.round(
          (entryDate.getTime() - prevStart.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (dayOffset < 0 || dayOffset > 4) continue; // skip weekend / out-of-range
        const targetDate = formatDateIso(addDays(curStart, dayOffset));
        const key = cellKey(entry.projectId, targetDate);
        setCell(key, {
          hours: formatHoursNl(entry.hours),
          notes: entry.notes ?? "",
        });
        copied++;
      }
      if (copied === 0) {
        toast.info("Geen werkdag-uren gevonden in vorige week");
      } else {
        toast.success(`${copied} cellen gekopieerd uit vorige week`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setFilling(false);
    }
  }

  function handleHoursChange(projectId: string, workDate: string, raw: string) {
    setCell(cellKey(projectId, workDate), { hours: raw });
  }

  function handleNotesChange(projectId: string, workDate: string, raw: string) {
    setCell(cellKey(projectId, workDate), { notes: raw });
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      // Flush any pending edits first.
      if (isDirty) await saveNow();
      const res = await fetch("/api/uren/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Versturen mislukt");
        return;
      }
      toast.success("Week verstuurd");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setSubmitting(false);
    }
  }

  // Totals.
  const dayTotals = days.map((d) =>
    projects.reduce((acc, p) => {
      const cell = cells[cellKey(p.id, d.iso)];
      const n = parseHoursLoose(cell?.hours);
      return acc + (n ?? 0);
    }, 0),
  );
  const projectTotals = projects.map((p) =>
    days.reduce((acc, d) => {
      const cell = cells[cellKey(p.id, d.iso)];
      const n = parseHoursLoose(cell?.hours);
      return acc + (n ?? 0);
    }, 0),
  );
  const weekTotal = dayTotals.reduce((a, b) => a + b, 0);

  const statusColor = STATUS_COLORS[status];

  const showFillButton = !readOnly && isWeekEmpty && projects.length > 0;

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <Header
          weekStart={weekStart}
          rangeLabel={rangeLabel}
          weekTotal={0}
          status={status}
          statusColor={statusColor}
          saveStatus={saveStatus}
          showFillButton={false}
          filling={false}
          onFillFromPrevWeek={() => {}}
        />
        <NoAssignmentsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header
        weekStart={weekStart}
        rangeLabel={rangeLabel}
        weekTotal={weekTotal}
        status={status}
        statusColor={statusColor}
        saveStatus={saveStatus}
        showFillButton={showFillButton}
        filling={filling}
        onFillFromPrevWeek={() => void handleFillFromPrevWeek()}
      />

      {status === "rejected" && rejectionReason && (
        <div
          className="flex items-start gap-3 rounded-md border p-4 text-sm"
          style={{
            borderColor: "var(--status-danger)",
            background: "rgba(255,90,138,0.08)",
            color: "var(--fg-primary)",
          }}
        >
          <AlertCircle
            size={16}
            style={{ color: "var(--status-danger)", flexShrink: 0, marginTop: 2 }}
          />
          <div>
            <div className="font-medium">Week is afgewezen</div>
            <div className="mt-1" style={{ color: "var(--fg-secondary)" }}>
              {rejectionReason}
            </div>
            <div className="mt-2 text-xs" style={{ color: "var(--fg-tertiary)" }}>
              Pas je uren aan en verstuur opnieuw.
            </div>
          </div>
        </div>
      )}

      {status === "approved" && (
        <div
          className="flex items-center gap-2 rounded-md border p-3 text-sm"
          style={{
            borderColor: "var(--status-success)",
            background: "rgba(61,216,168,0.08)",
            color: "var(--fg-primary)",
          }}
        >
          <Check size={16} style={{ color: "var(--status-success)" }} />
          Deze week is goedgekeurd. Wijzigen is niet meer mogelijk.
        </div>
      )}

      <div
        className="overflow-hidden rounded-xl border glass-card"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div
          className="grid items-stretch text-xs uppercase tracking-wide"
          style={{
            gridTemplateColumns: "minmax(200px,1fr) repeat(5, 80px) 80px",
            background: "var(--surface-lift)",
            borderBottom: "1px solid var(--border-subtle)",
            color: "var(--fg-tertiary)",
          }}
        >
          <div className="p-3 font-medium">Project</div>
          {days.map((d) => (
            <div key={d.iso} className="p-3 text-center font-medium">
              {d.short} {d.dayNumber}
            </div>
          ))}
          <div className="p-3 text-right font-medium">Totaal</div>
        </div>

        {projects.map((project, rowIdx) => (
          <div
            key={project.id}
            className="grid items-stretch border-b last:border-0"
            style={{
              gridTemplateColumns: "minmax(200px,1fr) repeat(5, 80px) 80px",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="p-3 text-sm">
              <div className="font-medium" style={{ color: "var(--fg-primary)" }}>
                {project.name}
              </div>
              {project.clientName && (
                <div className="text-xs" style={{ color: "var(--fg-tertiary)" }}>
                  {project.clientName}
                </div>
              )}
            </div>
            {days.map((d) => {
              const key = cellKey(project.id, d.iso);
              const cell: CellState = cells[key] ?? { hours: "", notes: "" };
              return (
                <div
                  key={d.iso}
                  className="relative flex items-center justify-center p-1.5"
                >
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cell.hours}
                    disabled={readOnly}
                    placeholder="–"
                    onChange={(e) =>
                      handleHoursChange(project.id, d.iso, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                        e.preventDefault();
                        if (!readOnly) {
                          void handleSubmit();
                        }
                      }
                    }}
                    className="h-9 w-full rounded border bg-transparent text-center text-sm tabular-nums outline-none transition-colors focus:border-fg-primary disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      borderColor: cell.hours
                        ? "var(--border-muted)"
                        : "var(--border-subtle)",
                      color: "var(--fg-primary)",
                    }}
                    aria-label={`Uren voor ${project.name} op ${d.short} ${d.dayNumber}`}
                    tabIndex={rowIdx * 5 + 1}
                  />
                  {!readOnly && (
                    <NotePopover
                      value={cell.notes}
                      hasNote={cell.notes.trim() !== ""}
                      onChange={(notes) =>
                        handleNotesChange(project.id, d.iso, notes)
                      }
                    />
                  )}
                </div>
              );
            })}
            <div
              className="flex items-center justify-end p-3 text-sm tabular-nums"
              style={{ color: "var(--fg-secondary)" }}
            >
              {projectTotals[rowIdx]! > 0
                ? formatHoursNl(projectTotals[rowIdx]!)
                : "–"}
            </div>
          </div>
        ))}

        <div
          className="grid items-stretch text-xs uppercase tracking-wide"
          style={{
            gridTemplateColumns: "minmax(200px,1fr) repeat(5, 80px) 80px",
            background: "var(--surface-lift)",
            borderTop: "1px solid var(--border-subtle)",
            color: "var(--fg-tertiary)",
          }}
        >
          <div className="p-3 text-right font-medium">Dagtotaal</div>
          {dayTotals.map((total, i) => (
            <div
              key={days[i]!.iso}
              className="p-3 text-center font-medium tabular-nums"
              style={{ color: total > 0 ? "var(--fg-primary)" : "var(--fg-tertiary)" }}
            >
              {total > 0 ? formatHoursNl(total) : "–"}
            </div>
          ))}
          <div
            className="p-3 text-right font-medium tabular-nums"
            style={{ color: "var(--fg-primary)" }}
          >
            {weekTotal > 0 ? formatHoursNl(weekTotal) : "–"}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs" style={{ color: "var(--fg-tertiary)" }}>
          {readOnly
            ? status === "approved"
              ? "Goedgekeurd door admin — geen wijzigingen mogelijk."
              : "Verstuurd — wacht op goedkeuring."
            : "Auto-opslaan na 2s. ⌘S voor versturen."}
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              disabled={!isDirty || saveStatus.kind === "saving"}
              onClick={() => void saveNow()}
            >
              Opslaan als concept
            </Button>
          )}
          {!readOnly && (
            <Button
              size="sm"
              disabled={submitting || weekTotal === 0}
              onClick={() => void handleSubmit()}
            >
              <Send className="size-3.5" />
              Verstuur week
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Header({
  weekStart,
  rangeLabel,
  weekTotal,
  status,
  statusColor,
  saveStatus,
  showFillButton,
  filling,
  onFillFromPrevWeek,
}: {
  weekStart: string;
  rangeLabel: string;
  weekTotal: number;
  status: WeekStatus;
  statusColor: { bg: string; fg: string };
  saveStatus: ReturnType<typeof useWeekState>["saveStatus"];
  showFillButton: boolean;
  filling: boolean;
  onFillFromPrevWeek: () => void;
}) {
  return (
    <header className="space-y-4">
      <div>
        <div
          className="mb-1 font-mono text-[11px] uppercase tracking-wider"
          style={{ color: "var(--fg-tertiary)" }}
        >
          Mijn uren
        </div>
        <h1 className="font-display text-display leading-none">
          <span>Week</span>
          <em>grid</em>
        </h1>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WeekPicker weekStart={weekStart} rangeLabel={rangeLabel} />
        <div className="flex items-center gap-3">
          {showFillButton && (
            <Button
              variant="outline"
              size="sm"
              disabled={filling}
              onClick={onFillFromPrevWeek}
            >
              <Copy className="size-3.5" />
              {filling ? "Bezig…" : "Vul met vorige week"}
            </Button>
          )}
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: statusColor.bg, color: statusColor.fg }}
          >
            {STATUS_LABELS[status]}
          </span>
          <span
            className="text-sm tabular-nums"
            style={{ color: "var(--fg-secondary)" }}
          >
            Totaal:{" "}
            <span style={{ color: "var(--fg-primary)" }}>
              {weekTotal > 0 ? formatHoursNl(weekTotal) : "0,00"} u
            </span>
          </span>
          <SavedIndicator state={saveStatus} />
        </div>
      </div>
    </header>
  );
}

function NotePopover({
  value,
  hasNote,
  onChange,
}: {
  value: string;
  hasNote: boolean;
  onChange: (next: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="absolute right-1 top-1 rounded p-0.5 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 group-hover:opacity-60"
          style={{
            color: hasNote ? "var(--accent-violet, #8b5cf6)" : "var(--fg-tertiary)",
            opacity: hasNote ? 0.8 : undefined,
          }}
          aria-label="Notitie"
          tabIndex={-1}
        >
          <MessageSquare size={11} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <label
          htmlFor="cell-note"
          className="mb-1 block text-xs font-medium"
          style={{ color: "var(--fg-secondary)" }}
        >
          Notitie
        </label>
        <textarea
          id="cell-note"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Optionele toelichting voor deze cel"
          className="w-full rounded border bg-transparent p-2 text-sm outline-none focus:border-fg-primary"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--fg-primary)",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function parseHoursLoose(raw: string | undefined): number | null {
  if (!raw) return null;
  if (raw.trim() === "") return null;
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n;
}
