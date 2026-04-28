import type { ReactNode } from "react";

import { oklchEmphasis, oklchSubtleBg } from "@/lib/design/oklch";

interface PassportStatProps {
  label: string;
  value: string;
  sub?: string;
}

export function PassportStat({ label, value, sub }: PassportStatProps) {
  return (
    <div>
      <div
        className="font-mono uppercase tracking-[0.16em]"
        style={{ fontSize: 10, color: "var(--fg-tertiary)" }}
      >
        {label}
      </div>
      <div
        className="mt-1.5 font-display tabular-nums"
        style={{
          fontSize: 24,
          fontWeight: 500,
          color: "var(--fg-primary)",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="mt-0.5"
          style={{ fontSize: 11, color: "var(--fg-tertiary)" }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

interface BreakdownStatProps {
  label: string;
  value: string;
  sub?: string;
  hue?: number;
  emphasis?: boolean;
}

export function BreakdownStat({
  label,
  value,
  sub,
  hue = 165,
  emphasis = false,
}: BreakdownStatProps) {
  const tinted = oklchSubtleBg(hue);
  const emphasisColor = oklchEmphasis(hue);

  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{
        background: emphasis ? tinted : "rgba(255, 255, 255, 0.55)",
        border: emphasis
          ? `1px solid ${oklchEmphasis(hue)}40`
          : "1px solid var(--border-subtle)",
      }}
    >
      <div
        className="font-mono uppercase tracking-wider"
        style={{
          fontSize: 9,
          color: emphasis ? emphasisColor : "var(--fg-tertiary)",
        }}
      >
        {label}
      </div>
      <div
        className="mt-1 font-display tabular-nums leading-none"
        style={{
          fontSize: 28,
          fontWeight: 500,
          color: emphasis ? emphasisColor : "var(--fg-primary)",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="mt-1"
          style={{
            fontSize: 10,
            color: emphasis ? emphasisColor : "var(--fg-tertiary)",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

interface DetailRowProps {
  icon?: ReactNode;
  label: string;
  pct?: string;
  diffBadge?: ReactNode;
  value: string;
  highlightHue?: number;
  onClick?: () => void;
  expanded?: boolean;
  expandedContent?: ReactNode;
}

export function DetailRow({
  icon,
  label,
  pct,
  diffBadge,
  value,
  highlightHue,
  onClick,
  expanded,
  expandedContent,
}: DetailRowProps) {
  const tinted = highlightHue != null ? oklchSubtleBg(highlightHue) : undefined;

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors"
        style={{
          background: tinted ?? "transparent",
          cursor: onClick ? "pointer" : "default",
        }}
      >
        {icon && (
          <span
            className="flex shrink-0 items-center justify-center"
            style={{ width: 20, height: 20 }}
          >
            {icon}
          </span>
        )}
        <span
          className="flex-1 text-sm"
          style={{ color: "var(--fg-primary)" }}
        >
          {label}
        </span>
        {pct && (
          <span
            className="font-mono tabular-nums"
            style={{ fontSize: 11, color: "var(--fg-tertiary)" }}
          >
            {pct}
          </span>
        )}
        {diffBadge}
        <span
          className="font-mono tabular-nums"
          style={{ fontSize: 13, color: "var(--fg-primary)" }}
        >
          {value}
        </span>
      </button>
      {expanded && expandedContent && (
        <div
          className="px-3 pb-2 pt-1 text-xs"
          style={{ color: "var(--fg-secondary)" }}
        >
          {expandedContent}
        </div>
      )}
    </div>
  );
}
