"use client";

import type { HourEntryEnriched } from "@casella/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Per-cell hour entry: keyed by `${projectId}__${workDate}`.
 * Stored as the raw string the user typed so we can preserve "" (empty)
 * vs "0" semantics and distinguish dirty/clean state without parsing every key.
 */
export interface CellState {
  hours: string;
  notes: string;
}

export type WeekCells = Record<string, CellState>;

export type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string };

export function cellKey(projectId: string, workDate: string): string {
  return `${projectId}__${workDate}`;
}

function parseHours(raw: string): number | null {
  if (raw.trim() === "") return null;
  // Accept comma decimals (Dutch). User might paste "8,5" or "8.5".
  const normalised = raw.replace(",", ".");
  const n = Number(normalised);
  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > 24) return null;
  return n;
}

function buildInitialCells(entries: HourEntryEnriched[]): WeekCells {
  const cells: WeekCells = {};
  for (const e of entries) {
    cells[cellKey(e.projectId, e.workDate)] = {
      hours: e.hours,
      notes: e.notes ?? "",
    };
  }
  return cells;
}

interface UseWeekStateOptions {
  weekStart: string;
  initialEntries: HourEntryEnriched[];
  enabled: boolean;
  delayMs?: number;
}

export interface UseWeekStateResult {
  cells: WeekCells;
  setCell: (key: string, patch: Partial<CellState>) => void;
  saveStatus: SaveStatus;
  isDirty: boolean;
  saveNow: () => Promise<void>;
}

/**
 * Tracks the user-edited week grid state and debounces auto-save against
 * `PUT /api/uren/week`. The hook owns a `lastSavedRef` snapshot so it can
 * decide whether the local cells diverged from the last server-acknowledged
 * payload (and therefore warrant a network round-trip).
 *
 * `enabled=false` (e.g. when the week is submitted/approved) suspends saves
 * entirely — the caller renders a read-only grid and we never POST a no-op.
 */
export function useWeekState({
  weekStart,
  initialEntries,
  enabled,
  delayMs = 2000,
}: UseWeekStateOptions): UseWeekStateResult {
  const initial = useMemo(() => buildInitialCells(initialEntries), [initialEntries]);
  const [cells, setCells] = useState<WeekCells>(initial);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ kind: "idle" });
  const lastSavedRef = useRef<WeekCells>(initial);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when the week changes (week-picker navigates).
  useEffect(() => {
    setCells(initial);
    lastSavedRef.current = initial;
    setSaveStatus({ kind: "idle" });
  }, [initial]);

  const setCell = useCallback((key: string, patch: Partial<CellState>) => {
    setCells((prev) => {
      const existing = prev[key] ?? { hours: "", notes: "" };
      const next: CellState = { ...existing, ...patch };
      // Drop the key entirely when both fields are empty so the diff is clean.
      if (next.hours.trim() === "" && next.notes.trim() === "") {
        const rest: WeekCells = {};
        for (const [k, v] of Object.entries(prev)) {
          if (k !== key) rest[k] = v;
        }
        return rest;
      }
      return { ...prev, [key]: next };
    });
  }, []);

  const buildEntries = useCallback((source: WeekCells) => {
    const entries: { projectId: string; workDate: string; hours: number; notes: string | null }[] = [];
    for (const [key, value] of Object.entries(source)) {
      const hours = parseHours(value.hours);
      if (hours === null) continue; // skip empty/invalid cells
      const sep = key.indexOf("__");
      const projectId = key.slice(0, sep);
      const workDate = key.slice(sep + 2);
      entries.push({
        projectId,
        workDate,
        hours,
        notes: value.notes.trim() === "" ? null : value.notes,
      });
    }
    return entries;
  }, []);

  const persist = useCallback(
    async (snapshot: WeekCells) => {
      setSaveStatus({ kind: "saving" });
      try {
        const res = await fetch("/api/uren/week", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weekStart,
            entries: buildEntries(snapshot),
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string };
          setSaveStatus({
            kind: "error",
            message: body.message ?? "Opslaan mislukt",
          });
          return;
        }
        lastSavedRef.current = snapshot;
        setSaveStatus({ kind: "saved", at: new Date() });
      } catch (err) {
        setSaveStatus({
          kind: "error",
          message: err instanceof Error ? err.message : "Onbekende fout",
        });
      }
    },
    [weekStart, buildEntries],
  );

  // Debounced auto-save loop.
  useEffect(() => {
    if (!enabled) return;
    const dirty = JSON.stringify(cells) !== JSON.stringify(lastSavedRef.current);
    if (!dirty) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void persist(cells);
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cells, enabled, delayMs, persist]);

  const isDirty = useMemo(
    () => JSON.stringify(cells) !== JSON.stringify(lastSavedRef.current),
    [cells],
  );

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    await persist(cells);
  }, [cells, persist]);

  return { cells, setCell, saveStatus, isDirty, saveNow };
}
