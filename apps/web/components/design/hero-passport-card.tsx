import type { ReactNode } from "react";

interface HeroPassportCardProps {
  children: ReactNode;
  watermark?: ReactNode;
  className?: string;
}

export function HeroPassportCard({
  children,
  watermark,
  className = "",
}: HeroPassportCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl ${className}`}
      style={{
        background:
          "linear-gradient(135deg, #faf6ee 0%, #f0ebda 60%, #e8e0c8 100%)",
        border: "1px solid var(--border-subtle)",
        boxShadow:
          "0 24px 48px -24px rgba(14,22,33,0.18), inset 0 1px 0 rgba(255,255,255,0.5)",
      }}
    >
      {watermark && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          {watermark}
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
