"use client";

interface EmployeeAvatarProps {
  firstName: string | null;
  lastName: string | null;
  displayName?: string | null;
  size?: number;
}

export function EmployeeAvatar({ firstName, lastName, displayName, size = 34 }: EmployeeAvatarProps) {
  const first = firstName ?? displayName?.split(" ")[0] ?? "";
  const last = lastName ?? displayName?.split(" ").slice(1).join(" ") ?? "";
  const initials = first && last
    ? `${first[0]}${last[0]}`.toUpperCase()
    : first
    ? first[0]?.toUpperCase() ?? "?"
    : "?";

  const hue = ((first.length + last.length) * 23 + 180) % 360;
  const hue2 = (hue + 35) % 360;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, oklch(0.72 0.17 ${hue}), oklch(0.55 0.20 ${hue2}))`,
        color: "#fff",
        fontSize: size * 0.38,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        flexShrink: 0,
        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
