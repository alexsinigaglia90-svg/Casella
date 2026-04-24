"use client";

import type { ReactNode } from "react";

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-40"
      style={{
        background: disabled ? "var(--ink-4)" : "var(--aurora-violet)",
        color: "#fff",
        boxShadow: disabled ? "none" : "0 4px 18px rgba(123, 92, 255, 0.35)",
      }}
    >
      {children}
    </button>
  );
}
