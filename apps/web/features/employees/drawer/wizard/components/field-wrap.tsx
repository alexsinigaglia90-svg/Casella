"use client";

import { useState, type ReactNode } from "react";
import { Sparkles, AlertCircle } from "lucide-react";

interface FieldWrapProps {
  label: string;
  hint?: string;
  error?: string | false | null;
  icon?: ReactNode;
  autoFilled?: boolean;
  children: ReactNode;
  className?: string;
}

export function FieldWrap({
  label,
  hint,
  error,
  icon,
  autoFilled,
  children,
  className = "",
}: FieldWrapProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={className}>
      <label className="mb-1.5 flex items-baseline justify-between gap-2">
        <span
          className="whitespace-nowrap text-[11px] font-medium uppercase tracking-wider"
          style={{ color: "var(--text-tertiary)" }}
        >
          {label}
        </span>
        {autoFilled && (
          <span
            className="flex shrink-0 items-center gap-1 text-[10px]"
            style={{ color: "var(--aurora-violet)" }}
          >
            <Sparkles size={10} /> auto-gevuld
          </span>
        )}
      </label>
      <div
        className="flex items-center gap-2 rounded-lg px-3 transition-all"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: "var(--surface-base)",
          border: `1.5px solid ${
            error
              ? "var(--aurora-rose)"
              : focused
                ? "var(--aurora-violet)"
                : "var(--border-subtle)"
          }`,
          boxShadow:
            focused && !error
              ? "0 0 0 4px rgba(123, 92, 255, 0.12)"
              : error
                ? "0 0 0 4px rgba(255, 90, 138, 0.10)"
                : "none",
        }}
      >
        {icon && (
          <span style={{ color: focused ? "var(--aurora-violet)" : "var(--text-tertiary)" }}>
            {icon}
          </span>
        )}
        <div className="flex-1">{children}</div>
      </div>
      {error ? (
        <div
          className="mt-1 flex items-center gap-1 text-[11px]"
          style={{ color: "var(--aurora-rose)" }}
        >
          <AlertCircle size={11} /> {error}
        </div>
      ) : hint ? (
        <div className="mt-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}
