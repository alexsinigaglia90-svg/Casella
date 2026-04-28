"use client";

import type { ProjectStatus } from "@casella/types";

const LABEL: Record<ProjectStatus, string> = {
  planned: "Gepland",
  active: "Actief",
  completed: "Voltooid",
  cancelled: "Geannuleerd",
};

// Status hues per design handoff: active=harvest(145), planned=cool(240),
// completed=harvest+gray(145 desaturated), cancelled=warm(25)
const STATUS_HUE: Record<ProjectStatus, number> = {
  active: 145,
  planned: 240,
  completed: 145,
  cancelled: 25,
};

const STATUS_SAT: Record<ProjectStatus, number> = {
  active: 0.06,
  planned: 0.06,
  completed: 0.02,
  cancelled: 0.06,
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const hue = STATUS_HUE[status];
  const sat = STATUS_SAT[status];
  const bg = `oklch(0.95 ${sat} ${hue})`;
  const fg = `oklch(0.35 0.18 ${hue})`;
  const dot = `oklch(0.55 0.18 ${hue})`;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{
        background: bg,
        color: fg,
        border: `1px solid ${dot}30`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: dot }}
        aria-hidden
      />
      {LABEL[status]}
    </span>
  );
}
