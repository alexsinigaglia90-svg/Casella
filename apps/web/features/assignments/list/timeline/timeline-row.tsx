"use client";

import { useMemo } from "react";

import {
  AssignmentBlock,
  TIMELINE_LANE_GAP_PX,
  TIMELINE_LANE_HEIGHT_PX,
  type TimelineBlockData,
} from "./assignment-block";
import type { DragMode, DragState } from "./use-drag-state";

import {
  PX_PER_WEEK,
  SIDEBAR_WIDTH_PX,
  dayToX,
} from "@/lib/assignments/week-math";

interface TimelineRowProps {
  rowId: string;
  rowLabel: string;
  rowSubLabel: string;
  /** Avatar initials for the people-axis. */
  avatarInitials: string;
  /** Avatar tint (CSS color) — usually derived from stringHue. */
  avatarTint: string;
  blocks: TimelineBlockData[];
  baseStart: Date;
  totalWeeks: number;
  todayIso: string;
  showCapBar: boolean;
  showGhost: boolean;
  showRevenue: boolean;
  dragState: DragState | null;
  onDragStart: (
    id: string,
    mode: DragMode,
    pointerX: number,
    pointerY: number,
    block: TimelineBlockData,
  ) => void;
  onKeyboardCommit: (id: string, dStart: number, dEnd: number) => void;
  /** When true, capacity bar reflects hours summed across all blocks (people axis only). */
  isPeopleAxis: boolean;
}

/** Per-row capacity gradient — green/yellow/red from utilization percentage. */
function capacityGradient(utilizationPct: number): string {
  const pct = Math.max(0, Math.min(120, utilizationPct));
  let color: string;
  if (utilizationPct < 85) color = "var(--status-success)";
  else if (utilizationPct < 100) color = "var(--status-warning)";
  else color = "var(--status-danger)";
  return `linear-gradient(90deg, ${color} ${pct}%, transparent ${pct}%)`;
}

export function TimelineRow({
  rowId: _rowId,
  rowLabel,
  rowSubLabel,
  avatarInitials,
  avatarTint,
  blocks,
  baseStart,
  totalWeeks,
  todayIso,
  showCapBar,
  showGhost,
  showRevenue,
  dragState,
  onDragStart,
  onKeyboardCommit,
  isPeopleAxis,
}: TimelineRowProps) {
  const totalDays = totalWeeks * 7;
  const totalWidth = totalWeeks * PX_PER_WEEK;

  // Lane count — use the max lane index in the prepared blocks (already
  // assigned by the parent via greedy lane-fit), or 1 minimum.
  const laneCount = useMemo(() => {
    const max = blocks.reduce((acc, b) => Math.max(acc, b.lane), 0);
    return Math.max(1, max + 1);
  }, [blocks]);

  const blocksHeight = laneCount * TIMELINE_LANE_HEIGHT_PX + (laneCount - 1) * TIMELINE_LANE_GAP_PX;

  // Capacity utilisation: total hours scheduled this horizon / (40h × weeks).
  const utilisation = useMemo(() => {
    if (!isPeopleAxis || !showCapBar) return null;
    let scheduledHours = 0;
    for (const b of blocks) {
      const visStart = Math.max(b.startDay, 0);
      const visEnd = Math.min(b.endDay + 1, totalDays);
      const days = Math.max(0, visEnd - visStart);
      const weeks = days / 7;
      scheduledHours += weeks * b.hoursPerWeek;
    }
    const capacity = 40 * totalWeeks;
    if (capacity <= 0) return null;
    return Math.round((scheduledHours / capacity) * 100);
  }, [blocks, isPeopleAxis, showCapBar, totalWeeks, totalDays]);

  // Today indicator within the row.
  const today = useMemo(() => {
    const [y, m, d] = todayIso.split("-").map((p) => Number(p));
    return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  }, [todayIso]);
  const todayX = dayToX(today, baseStart);
  const todayInRange = todayX >= 0 && todayX <= totalWidth;

  const rowHeight = blocksHeight + (showCapBar && utilisation !== null ? 18 : 0) + 16;

  return (
    <div
      className="flex border-b"
      style={{
        borderColor: "var(--border-subtle)",
        minHeight: rowHeight,
      }}
    >
      {/* Sidebar */}
      <div
        className="flex shrink-0 items-start gap-2.5 px-3 py-3"
        style={{
          width: SIDEBAR_WIDTH_PX,
          borderRight: "1px solid var(--border-subtle)",
          background: "var(--surface-base)",
          position: "sticky",
          left: 0,
          zIndex: 1,
        }}
      >
        <div
          className="flex shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold"
          style={{
            width: 28,
            height: 28,
            background: avatarTint,
            color: "var(--surface-base)",
          }}
          aria-hidden
        >
          {avatarInitials}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[13px] font-medium"
            style={{ color: "var(--fg-primary)" }}
          >
            {rowLabel}
          </div>
          <div
            className="truncate text-[11px]"
            style={{ color: "var(--fg-tertiary)" }}
          >
            {rowSubLabel}
          </div>
        </div>
      </div>

      {/* Track */}
      <div
        className="relative"
        style={{
          width: totalWidth,
          paddingTop: 8,
          paddingBottom: 8,
        }}
      >
        {/* Week-grid lines */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {Array.from({ length: totalWeeks + 1 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: i * PX_PER_WEEK,
                top: 0,
                bottom: 0,
                width: 1,
                borderLeft: "1px solid var(--border-subtle)",
                opacity: 0.6,
              }}
            />
          ))}
        </div>

        {/* Today line */}
        {todayInRange && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0"
            style={{
              left: todayX,
              width: 1,
              borderLeft: "1.5px dashed var(--status-danger)",
              opacity: 0.45,
            }}
          />
        )}

        {/* Blocks layer */}
        <div
          className="relative"
          style={{ height: blocksHeight, width: totalWidth }}
        >
          {blocks.map((b) => (
            <AssignmentBlock
              key={b.id}
              block={b}
              baseStart={baseStart}
              totalDays={totalDays}
              dragState={dragState}
              showGhost={showGhost}
              showRevenue={showRevenue}
              onDragStart={onDragStart}
              onKeyboardCommit={onKeyboardCommit}
            />
          ))}
        </div>

        {/* Capacity bar */}
        {isPeopleAxis && showCapBar && utilisation !== null && (
          <div
            className="mt-2"
            style={{
              height: 6,
              borderRadius: 3,
              background: "var(--surface-lift)",
              border: "1px solid var(--border-subtle)",
              overflow: "hidden",
              width: totalWidth - 8,
              marginLeft: 4,
            }}
            aria-label={`Capaciteitsbenutting ${utilisation}%`}
          >
            <div
              style={{
                height: "100%",
                background: capacityGradient(utilisation),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
