"use client";

import { AlertCircle, Check, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import type { SaveState } from "./use-auto-save";

/**
 * Compact status pill that mirrors the auto-save lifecycle. Renders nothing
 * for the `idle` status so the surrounding layout stays calm until the first
 * mutation. The "saved" branch live-updates the relative timestamp every 5s
 * for the first 30s, then flips to an absolute `HH:mm` clock to keep the
 * UI stable during long edit sessions.
 */
export function SavedIndicator({ state }: { state: SaveState }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(t);
  }, []);

  if (state.status === "idle") return null;

  const baseClass = "inline-flex items-center gap-1.5 text-xs";

  if (state.status === "saving") {
    return (
      <span className={baseClass} style={{ color: "var(--fg-tertiary)" }}>
        <Loader2 className="size-3 animate-spin" /> Opslaan…
      </span>
    );
  }

  if (state.status === "saved") {
    const ageSec = Math.floor((now - state.at.getTime()) / 1000);
    if (ageSec <= 30) {
      return (
        <span className={baseClass} style={{ color: "var(--status-success)" }}>
          <span
            className="size-1.5 animate-pulse rounded-full"
            style={{ background: "var(--status-success)" }}
          />
          Opgeslagen {ageSec}s geleden
        </span>
      );
    }
    return (
      <span className={baseClass} style={{ color: "var(--fg-tertiary)" }}>
        <Check className="size-3" />
        Opgeslagen om {state.at.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
      </span>
    );
  }

  if (state.status === "error") {
    return (
      <span className={baseClass} style={{ color: "var(--status-danger)" }}>
        <AlertCircle className="size-3" />
        Opslaan mislukt — {state.message}
      </span>
    );
  }

  if (state.status === "conflict") {
    return (
      <span className={baseClass} style={{ color: "var(--status-attention, var(--accent-coral))" }}>
        <RefreshCw className="size-3" />
        Conflict — herlaad
      </span>
    );
  }

  return null;
}
