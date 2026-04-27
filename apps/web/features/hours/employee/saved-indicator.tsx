"use client";

import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import type { SaveStatus } from "./use-week-state";

/**
 * Mirror of `features/admin-shell/auto-save/saved-indicator` adapted to the
 * week-grid's lighter SaveStatus shape (no conflict branch — the PUT endpoint
 * does not use `If-Match`). Live-updates the relative timestamp every 5s for
 * the first 30s, then flips to an absolute clock to keep the UI calm during
 * long edit sessions.
 */
export function SavedIndicator({ state }: { state: SaveStatus }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(t);
  }, []);

  if (state.kind === "idle") return null;

  const baseClass = "inline-flex items-center gap-1.5 text-xs";

  if (state.kind === "saving") {
    return (
      <span className={baseClass} style={{ color: "var(--fg-tertiary)" }}>
        <Loader2 className="size-3 animate-spin" /> Bezig met opslaan…
      </span>
    );
  }

  if (state.kind === "saved") {
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

  if (state.kind === "error") {
    return (
      <span className={baseClass} style={{ color: "var(--status-danger)" }}>
        <AlertCircle className="size-3" />
        Niet opgeslagen — {state.message}
      </span>
    );
  }

  return null;
}
