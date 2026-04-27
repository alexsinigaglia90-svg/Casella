"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useMemo,
} from "react";

import type { DragMode, DragState } from "./use-drag-state";

import { type BlockTone } from "@/lib/assignments/palette";
import { PX_PER_WEEK, addDays, dayToX } from "@/lib/assignments/week-math";

export interface TimelineBlockData {
  id: string;
  employeeId: string;
  projectId: string;
  employeeName: string;
  projectName: string;
  clientName: string;
  /** Start day-offset from baseStart. Negative if the assignment began before the visible window. */
  startDay: number;
  /** End day-offset (inclusive). May exceed totalDays if the assignment runs past the window. */
  endDay: number;
  /** Concept = open-ended start (no startDate set). */
  isConcept: boolean;
  /** Whether the original `endDate` was null (open-ended end). */
  hasOpenEnd: boolean;
  /** Lane index for stacking overlapping blocks within a row. */
  lane: number;
  /** Hourly cost / week for capacity bar (defaults to 8h per workday × 5 = 40h baseline). */
  hoursPerWeek: number;
  /** Inferred role label for role-palette + conflict-popover filtering. */
  roleLabel: string | null;
  tone: BlockTone;
}

interface AssignmentBlockProps {
  block: TimelineBlockData;
  baseStart: Date;
  totalDays: number;
  /** Live drag state (only relevant when this.id matches dragState.origin.id). */
  dragState: DragState | null;
  showGhost: boolean;
  showRevenue: boolean;
  /** Called when a drag starts on this block. */
  onDragStart: (
    id: string,
    mode: DragMode,
    pointerX: number,
    pointerY: number,
    block: TimelineBlockData,
  ) => void;
  /** Called for keyboard nudges. dStart/dEnd in days. */
  onKeyboardCommit: (id: string, dStart: number, dEnd: number) => void;
}

const LANE_HEIGHT_PX = 36;
const LANE_GAP_PX = 4;
const EDGE_HANDLE_PX = 6;

function formatPeriod(startDay: number, endDay: number, baseStart: Date): string {
  const start = addDays(baseStart, startDay);
  const end = addDays(baseStart, endDay);
  const fmt = (d: Date) =>
    `${String(d.getUTCDate()).padStart(2, "0")} ${[
      "jan",
      "feb",
      "mrt",
      "apr",
      "mei",
      "jun",
      "jul",
      "aug",
      "sep",
      "okt",
      "nov",
      "dec",
    ][d.getUTCMonth()] ?? ""}`;
  return `${fmt(start)} → ${fmt(end)}`;
}

export function AssignmentBlock({
  block,
  baseStart,
  totalDays,
  dragState,
  showGhost,
  showRevenue,
  onDragStart,
  onKeyboardCommit,
}: AssignmentBlockProps) {
  const router = useRouter();
  const isDragging = dragState?.origin.id === block.id;

  // Compute live (during-drag) start/end day offsets.
  const liveOffsets = useMemo(() => {
    let startDay = block.startDay;
    let endDay = block.endDay;
    if (isDragging && dragState) {
      const dd = dragState.deltaDays;
      if (dragState.origin.mode === "move") {
        startDay = block.startDay + dd;
        endDay = block.endDay + dd;
      } else if (dragState.origin.mode === "resize-start") {
        startDay = Math.min(block.startDay + dd, block.endDay);
      } else if (dragState.origin.mode === "resize-end") {
        endDay = Math.max(block.endDay + dd, block.startDay);
      }
    }
    return { startDay, endDay };
  }, [isDragging, dragState, block]);

  // Visual bounds (clipped to the visible horizon).
  const visibleStart = Math.max(liveOffsets.startDay, 0);
  const visibleEnd = Math.min(liveOffsets.endDay + 1, totalDays); // +1 = inclusive end
  const xLeft = dayToX(addDays(baseStart, visibleStart), baseStart);
  const xRight = dayToX(addDays(baseStart, visibleEnd), baseStart);
  const width = Math.max(8, xRight - xLeft);

  // Open-end fade: when the assignment runs past the right edge, soften the
  // trailing edge with a mask.
  const fadeRight = block.hasOpenEnd && liveOffsets.endDay + 1 > totalDays;

  const top = block.lane * (LANE_HEIGHT_PX + LANE_GAP_PX);

  // Ghost preview at origin position while dragging.
  const ghostXLeft = dayToX(addDays(baseStart, Math.max(block.startDay, 0)), baseStart);
  const ghostXRight = dayToX(
    addDays(baseStart, Math.min(block.endDay + 1, totalDays)),
    baseStart,
  );
  const ghostWidth = Math.max(8, ghostXRight - ghostXLeft);

  const ariaLabel = useMemo(() => {
    return `Toewijzing van ${block.employeeName} aan ${block.projectName}, ${formatPeriod(
      liveOffsets.startDay,
      liveOffsets.endDay,
      baseStart,
    )}${block.isConcept ? " (concept)" : ""}`;
  }, [block, liveOffsets, baseStart]);

  const handlePointerDown = useCallback(
    (ev: ReactPointerEvent<HTMLDivElement>, mode: DragMode) => {
      if (ev.button !== 0) return;
      ev.stopPropagation();
      ev.preventDefault();
      // Capture pointer so subsequent moves are seen by document listeners.
      try {
        (ev.target as Element).releasePointerCapture?.(ev.pointerId);
      } catch {
        /* ignore */
      }
      onDragStart(block.id, mode, ev.clientX, ev.clientY, block);
    },
    [block, onDragStart],
  );

  const handleKeyDown = useCallback(
    (ev: KeyboardEvent<HTMLDivElement>) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        router.push(`/admin/toewijzingen/${block.id}` as Route);
        return;
      }
      const dir = ev.key === "ArrowLeft" ? -1 : ev.key === "ArrowRight" ? 1 : 0;
      if (!dir) return;
      ev.preventDefault();
      ev.stopPropagation();
      const days = 7 * dir;
      // Shift+arrows = adjust end-date; Alt+arrows = adjust start-date;
      // plain arrows = shift whole block (move).
      if (ev.shiftKey) {
        onKeyboardCommit(block.id, 0, days);
      } else if (ev.altKey) {
        onKeyboardCommit(block.id, days, 0);
      } else {
        onKeyboardCommit(block.id, days, days);
      }
    },
    [block.id, onKeyboardCommit, router],
  );

  const tone = block.tone;

  const baseStyle: CSSProperties = {
    position: "absolute",
    left: xLeft,
    top,
    width,
    height: LANE_HEIGHT_PX,
    background: tone.bg,
    color: tone.fg,
    border: `1px solid ${isDragging ? tone.borderActive : tone.border}`,
    borderRadius: 8,
    boxShadow: isDragging ? tone.shadowDrag : tone.shadow,
    cursor: isDragging ? "grabbing" : "grab",
    overflow: "hidden",
    transition: isDragging ? "none" : "box-shadow .18s ease-out, transform .18s ease-out",
    touchAction: "none",
    maskImage: fadeRight
      ? "linear-gradient(90deg, black 0%, black 80%, transparent 100%)"
      : undefined,
    WebkitMaskImage: fadeRight
      ? "linear-gradient(90deg, black 0%, black 80%, transparent 100%)"
      : undefined,
  };

  const accentBarStyle: CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    background: tone.accentBar,
    borderRadius: "8px 0 0 8px",
  };

  return (
    <>
      {/* Ghost at origin */}
      {isDragging && showGhost && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: ghostXLeft,
            top,
            width: ghostWidth,
            height: LANE_HEIGHT_PX,
            background: tone.ghostBg,
            border: `1.5px dashed ${tone.ghostBorder}`,
            borderRadius: 8,
            pointerEvents: "none",
          }}
        />
      )}

      <div
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-grabbed={isDragging || undefined}
        onPointerDown={(e) => handlePointerDown(e, "move")}
        onKeyDown={handleKeyDown}
        onDoubleClick={(e) => {
          e.stopPropagation();
          router.push(`/admin/toewijzingen/${block.id}` as Route);
        }}
        style={baseStyle}
      >
        {/* Left resize handle */}
        <div
          aria-hidden
          onPointerDown={(e) => handlePointerDown(e, "resize-start")}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: EDGE_HANDLE_PX,
            cursor: "col-resize",
            background: "transparent",
          }}
        />
        {/* Right resize handle */}
        <div
          aria-hidden
          onPointerDown={(e) => handlePointerDown(e, "resize-end")}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: EDGE_HANDLE_PX,
            cursor: "col-resize",
            background: "transparent",
          }}
        />

        {/* Concept-state accent bar */}
        {block.isConcept && <div aria-hidden style={accentBarStyle} />}

        {/* Content */}
        <div
          className="flex h-full items-center gap-2 px-2.5 text-[11px]"
          style={{
            paddingLeft: block.isConcept ? 10 : 8,
            color: tone.fg,
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {block.projectName}
          </span>
          {block.roleLabel && (
            <span
              className="rounded-full px-1.5 py-0.5 font-mono text-[9px]"
              style={{
                background: tone.badgeBg,
                color: tone.badgeFg,
                flexShrink: 0,
              }}
            >
              {block.roleLabel}
            </span>
          )}
          {showRevenue && (
            <span
              className="ml-auto font-mono text-[9px]"
              style={{ color: tone.fg, opacity: 0.7, flexShrink: 0 }}
            >
              {block.hoursPerWeek}u/w
            </span>
          )}
        </div>
      </div>
    </>
  );
}

export const TIMELINE_LANE_HEIGHT_PX = LANE_HEIGHT_PX;
export const TIMELINE_LANE_GAP_PX = LANE_GAP_PX;
export const TIMELINE_PX_PER_WEEK = PX_PER_WEEK;
