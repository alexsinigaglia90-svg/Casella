interface EmploymentBadgeProps {
  status: string;
  variant?: "pill" | "dot" | "text";
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active: { label: "Actief", cls: "bg-status-success/15 text-status-success" },
  on_leave: { label: "Afwezig", cls: "bg-status-pending/15 text-status-pending" },
  sick: { label: "Ziek", cls: "bg-status-attention/15 text-status-attention" },
  terminated: { label: "Uit dienst", cls: "bg-status-danger/15 text-status-danger" },
};

export function EmploymentBadge({ status, variant = "pill" }: EmploymentBadgeProps) {
  const m = STATUS_MAP[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };

  if (variant === "text") {
    return <span className={`text-xs font-medium ${m.cls.split(" ").filter(c => c.startsWith("text-")).join(" ")}`}>{m.label}</span>;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}`}
    >
      {m.label}
    </span>
  );
}
