"use client";

import type { ProjectStatus } from "@casella/types";

const LABEL: Record<ProjectStatus, string> = {
  planned: "Gepland",
  active: "Actief",
  completed: "Voltooid",
  cancelled: "Geannuleerd",
};

/**
 * Color mapping kept inline (codebase-consistent CSS-vars pattern). Each
 * status gets a foreground + tinted background that reads on both light and
 * dark surfaces. Aurora-teal = active, aurora-violet = planned, fg-tertiary =
 * completed (neutral / past), aurora-rose = cancelled.
 */
const COLORS: Record<ProjectStatus, { fg: string; bg: string }> = {
  planned: {
    fg: "var(--aurora-violet)",
    bg: "rgba(123, 92, 255, 0.12)",
  },
  active: {
    fg: "var(--aurora-teal, #2fa881)",
    bg: "rgba(61, 216, 168, 0.14)",
  },
  completed: {
    fg: "var(--fg-tertiary)",
    bg: "rgba(0, 0, 0, 0.06)",
  },
  cancelled: {
    fg: "var(--aurora-rose, #d6336c)",
    bg: "rgba(255, 90, 138, 0.12)",
  },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const c = COLORS[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: c.bg, color: c.fg }}
    >
      {LABEL[status]}
    </span>
  );
}
