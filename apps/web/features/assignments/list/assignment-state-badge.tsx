"use client";

type AssignmentState = "current" | "past" | "future";

const LABEL: Record<AssignmentState, string> = {
  current: "Lopend",
  past: "Afgelopen",
  future: "Toekomstig",
};

const COLORS: Record<AssignmentState, { fg: string; bg: string }> = {
  current: {
    fg: "var(--aurora-teal, #2fa881)",
    bg: "rgba(61, 216, 168, 0.14)",
  },
  past: {
    fg: "var(--fg-tertiary)",
    bg: "rgba(0, 0, 0, 0.06)",
  },
  future: {
    fg: "var(--aurora-violet)",
    bg: "rgba(123, 92, 255, 0.12)",
  },
};

export function AssignmentStateBadge({ state }: { state: AssignmentState }) {
  const c = COLORS[state];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: c.bg, color: c.fg }}
    >
      {LABEL[state]}
    </span>
  );
}
