// Status hues: active=harvest(145), on_leave=sun(50), sick=cool(240), terminated=warm(25)
const STATUS_HUE: Record<string, number> = {
  active: 145,
  on_leave: 50,
  sick: 240,
  terminated: 25,
};

const STATUS_LABEL: Record<string, string> = {
  active: "Actief",
  on_leave: "Afwezig",
  sick: "Ziek",
  terminated: "Uit dienst",
};

function oklchTinted(hue: number): string {
  return `oklch(0.95 0.06 ${hue})`;
}
function oklchEmphasis(hue: number): string {
  return `oklch(0.35 0.18 ${hue})`;
}
function oklchPrimary(hue: number): string {
  return `oklch(0.55 0.18 ${hue})`;
}

interface EmploymentBadgeProps {
  status: string;
  variant?: "pill" | "dot" | "text";
}

export function EmploymentBadge({ status, variant = "pill" }: EmploymentBadgeProps) {
  const hue = STATUS_HUE[status] ?? 200;
  const label = STATUS_LABEL[status] ?? status;

  if (variant === "text") {
    return (
      <span className="text-xs font-medium" style={{ color: oklchPrimary(hue) }}>
        {label}
      </span>
    );
  }

  if (variant === "dot") {
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: oklchPrimary(hue),
            boxShadow: `0 0 0 3px ${oklchTinted(hue)}`,
          }}
          aria-hidden
        />
        <span style={{ color: "var(--fg-secondary)" }}>{label}</span>
      </span>
    );
  }

  // pill — OKLCH-tinted background
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        background: oklchTinted(hue),
        color: oklchEmphasis(hue),
        border: `1px solid ${oklchPrimary(hue)}30`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: oklchPrimary(hue) }}
        aria-hidden
      />
      {label}
    </span>
  );
}
