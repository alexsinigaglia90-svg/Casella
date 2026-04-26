interface EmploymentBadgeProps {
  status: string;
  variant?: "pill" | "dot" | "text";
}

const STATUS_MAP: Record<
  string,
  { label: string; dotVar: string; tintClass: string; textClass: string }
> = {
  active: {
    label: "Actief",
    dotVar: "var(--status-success)",
    tintClass: "bg-status-success/15",
    textClass: "text-status-success",
  },
  on_leave: {
    label: "Afwezig",
    dotVar: "var(--status-pending)",
    tintClass: "bg-status-pending/15",
    textClass: "text-status-pending",
  },
  sick: {
    label: "Ziek",
    dotVar: "var(--status-attention)",
    tintClass: "bg-status-attention/15",
    textClass: "text-status-attention",
  },
  terminated: {
    label: "Uit dienst",
    dotVar: "var(--status-danger)",
    tintClass: "bg-status-danger/15",
    textClass: "text-status-danger",
  },
};

const FALLBACK = {
  label: "?",
  dotVar: "var(--text-tertiary)",
  tintClass: "bg-muted",
  textClass: "text-muted-foreground",
};

export function EmploymentBadge({ status, variant = "pill" }: EmploymentBadgeProps) {
  const m = STATUS_MAP[status] ?? { ...FALLBACK, label: status };

  if (variant === "text") {
    return <span className={`text-xs font-medium ${m.textClass}`}>{m.label}</span>;
  }

  if (variant === "dot") {
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: m.dotVar,
            boxShadow: `0 0 0 3px color-mix(in oklch, ${m.dotVar} 13%, transparent)`,
          }}
          aria-hidden
        />
        <span className="text-fg-secondary">{m.label}</span>
      </span>
    );
  }

  // pill
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${m.tintClass} ${m.textClass}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: m.dotVar }}
        aria-hidden
      />
      {m.label}
    </span>
  );
}
