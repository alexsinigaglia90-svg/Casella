"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Debounced auto-save hook with optimistic-concurrency support.
 *
 * Fires a PATCH against `endpoint` when `data` changes and `computePatch`
 * returns a non-null payload. The hook owns a `lastSavedRef` snapshot so the
 * caller can express dirty-detection by diffing `current` against the last
 * acknowledged-by-server snapshot rather than the original initial state.
 *
 * `ifMatch` is forwarded as an `If-Match` header. A 409 response transitions
 * the state to `"conflict"` and invokes the optional `onConflict` callback;
 * the caller is responsible for resolution (typically `router.refresh()`
 * after the user acknowledges).
 *
 * `markSaved(snapshot)` lets a caller reconcile the auto-save state after a
 * manual save path (e.g. an explicit "Save" button) so the indicator stays
 * coherent and the hook does not re-emit a PATCH for the same diff.
 */

export type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; at: Date }
  | { status: "error"; message: string }
  | { status: "conflict" };

interface UseAutoSaveOptions<TForm, TPatch> {
  data: TForm;
  enabled: boolean;
  ifMatch: string | null;
  delay?: number;
  endpoint: string;
  computePatch: (current: TForm, lastSaved: TForm) => TPatch | null;
  onConflict?: () => void;
}

export interface UseAutoSaveResult<TForm> {
  state: SaveState;
  markSaved: (snapshot: TForm) => void;
}

export function useAutoSave<TForm, TPatch>({
  data,
  enabled,
  ifMatch,
  delay = 2000,
  endpoint,
  computePatch,
  onConflict,
}: UseAutoSaveOptions<TForm, TPatch>): UseAutoSaveResult<TForm> {
  const [state, setState] = useState<SaveState>({ status: "idle" });
  const lastSavedRef = useRef<TForm>(data);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const patch = computePatch(data, lastSavedRef.current);
    if (patch === null) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const snapshot = data;
      setState({ status: "saving" });
      try {
        const res = await fetch(endpoint, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(ifMatch ? { "If-Match": ifMatch } : {}),
          },
          body: JSON.stringify(patch),
        });
        if (res.status === 409) {
          setState({ status: "conflict" });
          onConflict?.();
          return;
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string };
          setState({
            status: "error",
            message: body.message ?? "Opslaan mislukt",
          });
          return;
        }
        lastSavedRef.current = snapshot;
        setState({ status: "saved", at: new Date() });
      } catch (err) {
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Onbekende fout",
        });
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, enabled, ifMatch, delay, endpoint, computePatch, onConflict]);

  const markSaved = useCallback((snapshot: TForm) => {
    lastSavedRef.current = snapshot;
    setState({ status: "saved", at: new Date() });
  }, []);

  return { state, markSaved };
}
