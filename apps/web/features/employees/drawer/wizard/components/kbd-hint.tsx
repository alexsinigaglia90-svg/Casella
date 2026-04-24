"use client";

interface KbdHintProps {
  k: string;
  label: string;
}

export function KbdHint({ k, label }: KbdHintProps) {
  return (
    <span className="flex items-center gap-1.5">
      <kbd
        className="inline-flex min-w-[26px] items-center justify-center rounded px-1.5 py-0.5 font-mono text-[10px]"
        style={{
          background: "var(--surface-base)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-secondary)",
        }}
      >
        {k}
      </kbd>
      <span>{label}</span>
    </span>
  );
}
