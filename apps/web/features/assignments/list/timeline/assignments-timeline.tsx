"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  type TimelineBlockData,
} from "./assignment-block";
import {
  type ConflictAlternative,
  ConflictPopover,
} from "./conflict-popover";
import { TimelineHeader } from "./timeline-header";
import { TimelineRow } from "./timeline-row";
import { type DragMode, type DragOrigin, useDragState } from "./use-drag-state";

import type { AssignmentListRow } from "@/app/(admin)/admin/toewijzingen/queries";
import { ROLE_HUE, blockTone, type PaletteName } from "@/lib/assignments/palette";
import { stringHue } from "@/lib/assignments/string-hue";
import { updateAssignmentRange } from "@/lib/assignments/update-range";
import {
  PX_PER_WEEK,
  SIDEBAR_WIDTH_PX,
  addDays,
  asIso,
  daysBetween,
  mondayOf,
  parseIso,
} from "@/lib/assignments/week-math";
import {
  HORIZON_WEEKS,
  type AssignmentsAxis,
  type AssignmentsHorizon,
} from "@/lib/list-prefs-cookie-shared-assignments";

interface AssignmentsTimelineProps {
  assignments: AssignmentListRow[];
  axis: AssignmentsAxis;
  horizon: AssignmentsHorizon;
  palette: PaletteName;
  showCapBar: boolean;
  showGhost: boolean;
  showRevenue: boolean;
  magnetic: boolean;
}

interface RawBlock {
  id: string;
  employeeId: string;
  projectId: string;
  employeeName: string;
  projectName: string;
  clientName: string;
  startDay: number; // signed days from baseStart
  endDay: number;
  isConcept: boolean;
  hasOpenEnd: boolean;
  hoursPerWeek: number;
  roleLabel: string | null;
}

interface PreparedRow {
  id: string;
  label: string;
  subLabel: string;
  initials: string;
  tint: string;
  blocks: TimelineBlockData[];
}

/** Greedy lane-fit packer: assigns each block the lowest lane index whose
 * existing blocks don't overlap. Stable, O(n × lanes). */
function packLanes(blocks: RawBlock[]): { block: RawBlock; lane: number }[] {
  const sorted = [...blocks].sort((a, b) => a.startDay - b.startDay);
  const laneEnds: number[] = [];
  const out: { block: RawBlock; lane: number }[] = [];
  for (const b of sorted) {
    let assigned = -1;
    for (let i = 0; i < laneEnds.length; i++) {
      const end = laneEnds[i];
      if (end !== undefined && end < b.startDay) {
        assigned = i;
        break;
      }
    }
    if (assigned === -1) {
      assigned = laneEnds.length;
      laneEnds.push(b.endDay);
    } else {
      laneEnds[assigned] = b.endDay;
    }
    out.push({ block: b, lane: assigned });
  }
  return out;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    const first = parts[0];
    return first ? first.slice(0, 2).toUpperCase() : "?";
  }
  const f = parts[0]?.[0] ?? "";
  const l = parts[parts.length - 1]?.[0] ?? "";
  return `${f}${l}`.toUpperCase();
}

/** Naive role-extraction from clientName/projectName context — placeholder. */
function inferRoleFromName(_employeeName: string): string | null {
  // The current data model doesn't carry an explicit role on assignments;
  // we leave this null and rely on `role` palette = baseHue fallback when
  // the actual role isn't known. Plan 1.x backlog may add `roleLabel` on
  // the assignment join later — wire it in here.
  return null;
}

export function AssignmentsTimeline({
  assignments,
  axis,
  horizon,
  palette,
  showCapBar,
  showGhost,
  showRevenue,
  magnetic,
}: AssignmentsTimelineProps) {
  const totalWeeks = HORIZON_WEEKS[horizon];

  const todayIso = useMemo(() => asIso(new Date()), []);
  // Anchor the timeline 1 week before today so blocks ending recently still
  // show context. Subtract weeks based on horizon (¼ of horizon as lookback).
  const baseStart = useMemo(() => {
    const today = parseIso(todayIso);
    const lookbackWeeks = Math.max(1, Math.round(totalWeeks * 0.25));
    return mondayOf(addDays(today, -lookbackWeeks * 7));
  }, [todayIso, totalWeeks]);

  // Optimistic ranges keyed by assignment id (override server data while a
  // commit is in flight, or to "stick" after a successful drop).
  const [optimisticRanges, setOptimisticRanges] = useState<
    Record<string, { startDate: string | null; endDate: string | null }>
  >({});

  // Conflict-popover state (shown after a drop that pushes a row >100%).
  const [conflict, setConflict] = useState<{
    blockId: string;
    utilisationPct: number;
    alternatives: ConflictAlternative[];
    revertTo: { startDate: string | null; endDate: string | null };
  } | null>(null);

  // Removes one key from the optimistic-ranges map (used to drop entries on
  // revert, since destructure-then-discard trips the no-unused-vars lint).
  const dropOptimistic = useCallback((id: string) => {
    setOptimisticRanges((prev) => {
      if (!(id in prev)) return prev;
      const next: Record<string, { startDate: string | null; endDate: string | null }> = {};
      for (const k of Object.keys(prev)) {
        if (k === id) continue;
        const entry = prev[k];
        if (entry) next[k] = entry;
      }
      return next;
    });
  }, []);

  // Compute prepared rows + blocks.
  const rows = useMemo<PreparedRow[]>(() => {
    return prepareRows(assignments, optimisticRanges, baseStart, axis, palette);
  }, [assignments, optimisticRanges, baseStart, axis, palette]);

  // Capacity helpers used after a drop to decide whether to surface conflicts.
  const calcUtilisationForRow = useCallback(
    (employeeId: string): number => {
      let scheduled = 0;
      for (const a of assignments) {
        if (a.employeeId !== employeeId) continue;
        const opt = optimisticRanges[a.id];
        const startIso = opt ? opt.startDate : a.startDate;
        const endIso = opt ? opt.endDate : a.endDate;
        if (!endIso) continue;
        const start = startIso ? parseIso(startIso) : baseStart;
        const end = parseIso(endIso);
        const winStart = addDays(baseStart, 0);
        const winEnd = addDays(baseStart, totalWeeks * 7);
        const visStart = start.getTime() < winStart.getTime() ? winStart : start;
        const visEnd = end.getTime() > winEnd.getTime() ? winEnd : end;
        const days = Math.max(0, daysBetween(visStart, visEnd) + 1);
        scheduled += (days / 7) * 40;
      }
      const capacity = 40 * totalWeeks;
      return Math.round((scheduled / capacity) * 100);
    },
    [assignments, optimisticRanges, baseStart, totalWeeks],
  );

  const findAlternatives = useCallback(
    (forEmployeeId: string): ConflictAlternative[] => {
      const byEmp = new Map<string, { name: string; scheduled: number }>();
      for (const a of assignments) {
        if (!byEmp.has(a.employeeId)) {
          byEmp.set(a.employeeId, { name: a.employeeName, scheduled: 0 });
        }
        const entry = byEmp.get(a.employeeId);
        if (!entry) continue;
        const opt = optimisticRanges[a.id];
        const startIso = opt ? opt.startDate : a.startDate;
        const endIso = opt ? opt.endDate : a.endDate;
        if (!endIso) continue;
        const start = startIso ? parseIso(startIso) : baseStart;
        const end = parseIso(endIso);
        const days = Math.max(0, daysBetween(start, end) + 1);
        entry.scheduled += (days / 7) * 40;
      }
      const total = 40 * totalWeeks;
      const candidates: ConflictAlternative[] = [];
      for (const [empId, info] of byEmp) {
        if (empId === forEmployeeId) continue;
        const free = Math.max(0, Math.round(total - info.scheduled));
        if (free <= 0) continue;
        candidates.push({
          employeeId: empId,
          employeeName: info.name,
          roleLabel: inferRoleFromName(info.name),
          freeHours: free,
        });
      }
      candidates.sort((a, b) => b.freeHours - a.freeHours);
      return candidates.slice(0, 3);
    },
    [assignments, optimisticRanges, baseStart, totalWeeks],
  );

  // Commit drag → server.
  const commitChange = useCallback(
    async (origin: DragOrigin, deltaDays: number) => {
      if (deltaDays === 0) return;
      const target = assignments.find((a) => a.id === origin.id);
      if (!target) return;

      // Compute new dates (relative to current optimistic or original).
      const opt = optimisticRanges[target.id];
      const curStart = opt ? opt.startDate : target.startDate;
      const curEnd = opt ? opt.endDate : target.endDate;
      const oldStart = curStart ? parseIso(curStart) : null;
      const oldEnd = curEnd ? parseIso(curEnd) : null;

      let newStart: Date | null = oldStart;
      let newEnd: Date | null = oldEnd;
      if (origin.mode === "move") {
        newStart = oldStart ? addDays(oldStart, deltaDays) : null;
        newEnd = oldEnd ? addDays(oldEnd, deltaDays) : null;
      } else if (origin.mode === "resize-start") {
        newStart = oldStart ? addDays(oldStart, deltaDays) : null;
      } else if (origin.mode === "resize-end") {
        newEnd = oldEnd ? addDays(oldEnd, deltaDays) : null;
      }

      const newStartIso = newStart ? asIso(newStart) : null;
      const newEndIso = newEnd ? asIso(newEnd) : null;

      // Optimistic update.
      setOptimisticRanges((prev) => ({
        ...prev,
        [target.id]: { startDate: newStartIso, endDate: newEndIso },
      }));

      // Server commit.
      try {
        const result = await updateAssignmentRange(
          target.id,
          newStartIso,
          newEndIso,
        );
        if (!result.ok) {
          // Revert.
          dropOptimistic(target.id);
          toast.error(result.error);
          return;
        }
      } catch (err) {
        dropOptimistic(target.id);
        toast.error(err instanceof Error ? err.message : "Bijwerken mislukt");
        return;
      }

      // Check overcapacity post-commit (people axis only).
      if (axis === "people") {
        const util = calcUtilisationForRow(target.employeeId);
        if (util > 100) {
          setConflict({
            blockId: target.id,
            utilisationPct: util,
            alternatives: findAlternatives(target.employeeId),
            revertTo: { startDate: target.startDate, endDate: target.endDate },
          });
        }
      }
    },
    [
      assignments,
      optimisticRanges,
      axis,
      calcUtilisationForRow,
      findAlternatives,
      dropOptimistic,
    ],
  );

  const { state: dragState, startDrag } = useDragState({
    pxPerWeek: PX_PER_WEEK,
    magnetic,
    onCommit: commitChange,
  });

  const handleDragStart = useCallback(
    (
      id: string,
      mode: DragMode,
      pointerX: number,
      pointerY: number,
      _block: TimelineBlockData,
    ) => {
      const target = assignments.find((a) => a.id === id);
      if (!target) return;
      const opt = optimisticRanges[id];
      const sIso = opt ? opt.startDate : target.startDate;
      const eIso = opt ? opt.endDate : target.endDate;
      const startDate = sIso ? parseIso(sIso) : baseStart;
      const endDate = eIso ? parseIso(eIso) : addDays(baseStart, totalWeeks * 7 - 1);
      startDrag(
        {
          id,
          mode,
          startDayOffset: daysBetween(baseStart, startDate),
          endDayOffset: daysBetween(baseStart, endDate),
        },
        pointerX,
        pointerY,
      );
    },
    [assignments, optimisticRanges, baseStart, totalWeeks, startDrag],
  );

  const handleKeyboardCommit = useCallback(
    (id: string, dStart: number, dEnd: number) => {
      const target = assignments.find((a) => a.id === id);
      if (!target) return;
      const opt = optimisticRanges[id];
      const sIso = opt ? opt.startDate : target.startDate;
      const eIso = opt ? opt.endDate : target.endDate;
      const newStart = sIso ? addDays(parseIso(sIso), dStart) : null;
      const newEnd = eIso ? addDays(parseIso(eIso), dEnd) : null;
      const newStartIso = newStart ? asIso(newStart) : null;
      const newEndIso = newEnd ? asIso(newEnd) : null;
      setOptimisticRanges((prev) => ({
        ...prev,
        [id]: { startDate: newStartIso, endDate: newEndIso },
      }));
      void updateAssignmentRange(id, newStartIso, newEndIso).then((r) => {
        if (!r.ok) {
          dropOptimistic(id);
          toast.error(r.error);
        }
      });
    },
    [assignments, optimisticRanges, dropOptimistic],
  );

  // Conflict actions.
  const handleAssignAlternative = useCallback(
    (newEmpId: string) => {
      // We don't change employee via the lightweight endpoint here — leave
      // this hook for a future PATCH employeeId once the backlog item lands.
      void newEmpId;
      toast.info("Verplaatsen naar collega volgt — gebruik tijdelijk de drawer.");
      setConflict(null);
    },
    [],
  );
  const handleAcceptOverbook = useCallback(() => {
    setConflict(null);
  }, []);
  const handleRevert = useCallback(() => {
    if (!conflict) return;
    const { blockId, revertTo } = conflict;
    setOptimisticRanges((prev) => ({ ...prev, [blockId]: revertTo }));
    void updateAssignmentRange(blockId, revertTo.startDate, revertTo.endDate).then(
      (r) => {
        if (r.ok) dropOptimistic(blockId);
      },
    );
    setConflict(null);
  }, [conflict, dropOptimistic]);

  return (
    <div
      className="rounded-xl border"
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--surface-base)",
        overflow: "hidden",
      }}
    >
      <div style={{ overflowX: "auto", overflowY: "visible" }}>
        <div style={{ minWidth: SIDEBAR_WIDTH_PX + totalWeeks * PX_PER_WEEK }}>
          <TimelineHeader
            baseStart={baseStart}
            totalWeeks={totalWeeks}
            todayIso={todayIso}
          />
          <div>
            {rows.length === 0 && (
              <div
                className="flex flex-col items-center gap-2 p-12 text-center"
                style={{ color: "var(--fg-secondary)" }}
              >
                <p
                  className="font-display"
                  style={{ fontSize: "var(--text-title)" }}
                >
                  Niets <em>gevonden</em>
                </p>
                <p className="text-sm">
                  Pas je filter aan of voeg een toewijzing toe.
                </p>
              </div>
            )}
            {rows.map((row) => (
              <TimelineRow
                key={row.id}
                rowId={row.id}
                rowLabel={row.label}
                rowSubLabel={row.subLabel}
                avatarInitials={row.initials}
                avatarTint={row.tint}
                blocks={row.blocks}
                baseStart={baseStart}
                totalWeeks={totalWeeks}
                todayIso={todayIso}
                showCapBar={showCapBar}
                showGhost={showGhost}
                showRevenue={showRevenue}
                dragState={dragState}
                onDragStart={handleDragStart}
                onKeyboardCommit={handleKeyboardCommit}
                isPeopleAxis={axis === "people"}
              />
            ))}
          </div>
        </div>
      </div>

      <ConflictPopover
        open={conflict !== null}
        blockId={conflict?.blockId ?? null}
        alternatives={conflict?.alternatives ?? []}
        utilisationPct={conflict?.utilisationPct ?? 0}
        onAssignAlternative={handleAssignAlternative}
        onAcceptOverbook={handleAcceptOverbook}
        onRevert={handleRevert}
      />
    </div>
  );
}

// ── Pure prep ──────────────────────────────────────────────────────────────

function prepareRows(
  assignments: AssignmentListRow[],
  optimistic: Record<string, { startDate: string | null; endDate: string | null }>,
  baseStart: Date,
  axis: AssignmentsAxis,
  palette: PaletteName,
): PreparedRow[] {
  if (assignments.length === 0) return [];

  // Group by axis-key.
  const groups = new Map<string, RawBlock[]>();
  const rowMeta = new Map<
    string,
    { label: string; subLabel: string; initials: string; tint: string }
  >();

  for (const a of assignments) {
    const opt = optimistic[a.id];
    const sIso = opt ? opt.startDate : a.startDate;
    const eIso = opt ? opt.endDate : a.endDate;

    const isConcept = sIso === null;
    const hasOpenEnd = eIso === null;

    const startDate = sIso ? parseIso(sIso) : baseStart;
    const endDate = eIso ? parseIso(eIso) : addDays(baseStart, 365);

    const startDay = daysBetween(baseStart, startDate);
    const endDay = daysBetween(baseStart, endDate);

    const roleLabel = inferRoleFromName(a.employeeName);

    const block: RawBlock = {
      id: a.id,
      employeeId: a.employeeId,
      projectId: a.projectId,
      employeeName: a.employeeName,
      projectName: a.projectName,
      clientName: a.clientName,
      startDay,
      endDay,
      isConcept,
      hasOpenEnd,
      hoursPerWeek: 8, // sane placeholder until contract-hours wire-up lands
      roleLabel,
    };

    const groupKey = axis === "people" ? a.employeeId : a.projectId;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey)?.push(block);

    if (!rowMeta.has(groupKey)) {
      const tintHue = stringHue(groupKey);
      // OKLCH gradient avatar: subtle warm-to-deep band per row, hue-rotated
      // 30deg for a duotone feel. Matches the design-handoff variation-A.
      const tint = `linear-gradient(135deg, oklch(0.72 0.14 ${tintHue}) 0%, oklch(0.48 0.18 ${(tintHue + 30) % 360}) 100%)`;
      if (axis === "people") {
        rowMeta.set(groupKey, {
          label: a.employeeName,
          subLabel: roleLabel ?? "Medewerker",
          initials: initialsFor(a.employeeName),
          tint,
        });
      } else {
        rowMeta.set(groupKey, {
          label: a.projectName,
          subLabel: a.clientName,
          initials: initialsFor(a.projectName),
          tint,
        });
      }
    }
  }

  // Second pass: lane-pack each group + materialize TimelineBlockData.
  const out: PreparedRow[] = [];
  for (const [key, raws] of groups) {
    const packed = packLanes(raws);
    const blocks: TimelineBlockData[] = packed.map(({ block, lane }) => {
      const baseHue =
        axis === "people"
          ? stringHue(block.projectId)
          : stringHue(block.employeeId);
      const roleHue = block.roleLabel ? ROLE_HUE[block.roleLabel] : undefined;
      const tone = blockTone({
        palette,
        baseHue,
        roleHue,
        isConcept: block.isConcept,
      });
      return {
        id: block.id,
        employeeId: block.employeeId,
        projectId: block.projectId,
        employeeName: block.employeeName,
        projectName: block.projectName,
        clientName: block.clientName,
        startDay: block.startDay,
        endDay: block.endDay,
        isConcept: block.isConcept,
        hasOpenEnd: block.hasOpenEnd,
        lane,
        hoursPerWeek: block.hoursPerWeek,
        roleLabel: block.roleLabel,
        tone,
      };
    });
    const meta = rowMeta.get(key);
    if (!meta) continue;
    out.push({
      id: key,
      label: meta.label,
      subLabel: meta.subLabel,
      initials: meta.initials,
      tint: meta.tint,
      blocks,
    });
  }

  // Sort rows by label for stability.
  out.sort((a, b) => a.label.localeCompare(b.label, "nl"));
  return out;
}
