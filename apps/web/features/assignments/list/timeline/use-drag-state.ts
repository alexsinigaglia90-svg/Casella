"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { snapToWeek } from "@/lib/assignments/week-math";

export type DragMode = "move" | "resize-start" | "resize-end";

export interface DragOrigin {
  id: string;
  mode: DragMode;
  /** Origin start in days (since baseStart) — used for visual offsets. */
  startDayOffset: number;
  /** Origin end in days (since baseStart). */
  endDayOffset: number;
}

export interface DragState {
  origin: DragOrigin;
  /** Pixel delta from pointer-down to current pointer position. */
  deltaPx: number;
  /** Day delta after applying snap (or raw px-to-day if snap off). */
  deltaDays: number;
  /** Current pointerX in document coordinates (used by conflict-popover). */
  pointerX: number;
  pointerY: number;
}

interface UseDragStateOptions {
  pxPerWeek: number;
  /** When false, drag deltas are not snapped to whole-week increments. */
  magnetic: boolean;
  /** Called once when the drag terminates (mouseup). Receives final deltaDays. */
  onCommit?: (origin: DragOrigin, deltaDays: number) => void;
}

/**
 * Manages drag/resize across all timeline blocks via document-level pointer
 * listeners. Only one block can be dragging at a time. Returning a stable
 * `startDrag` lets blocks initiate their own drag, while consumers (rows,
 * popover, etc.) read the current `state` to render previews.
 */
export function useDragState({ pxPerWeek, magnetic, onCommit }: UseDragStateOptions) {
  const [state, setState] = useState<DragState | null>(null);
  const stateRef = useRef<DragState | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  // Keep a ref in sync so document handlers always see the latest snapshot.
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const startDrag = useCallback(
    (origin: DragOrigin, pointerX: number, pointerY: number) => {
      startPointRef.current = { x: pointerX, y: pointerY };
      const initial: DragState = {
        origin,
        deltaPx: 0,
        deltaDays: 0,
        pointerX,
        pointerY,
      };
      setState(initial);
      stateRef.current = initial;
    },
    [],
  );

  const cancelDrag = useCallback(() => {
    startPointRef.current = null;
    setState(null);
    stateRef.current = null;
  }, []);

  // Document-level pointer listeners — installed only while a drag is active.
  useEffect(() => {
    if (!state) return;

    const handleMove = (ev: PointerEvent) => {
      const start = startPointRef.current;
      const cur = stateRef.current;
      if (!start || !cur) return;
      const deltaPx = ev.clientX - start.x;
      const deltaDays = magnetic
        ? snapToWeek(deltaPx, pxPerWeek)
        : Math.round((deltaPx / pxPerWeek) * 7);
      const next: DragState = {
        ...cur,
        deltaPx,
        deltaDays,
        pointerX: ev.clientX,
        pointerY: ev.clientY,
      };
      stateRef.current = next;
      setState(next);
    };

    const handleUp = () => {
      const cur = stateRef.current;
      const start = startPointRef.current;
      startPointRef.current = null;
      if (cur && start && onCommitRef.current) {
        onCommitRef.current(cur.origin, cur.deltaDays);
      }
      setState(null);
      stateRef.current = null;
    };

    const handleKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        startPointRef.current = null;
        setState(null);
        stateRef.current = null;
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      window.removeEventListener("keydown", handleKey);
    };
    // We intentionally only re-run when a drag (un)mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state !== null]);

  return { state, startDrag, cancelDrag };
}
