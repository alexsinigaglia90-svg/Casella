import type { ReactNode } from "react";

interface TopBarProps {
  leftSlot?: ReactNode;
  centerSlot?: ReactNode;
  rightSlot?: ReactNode;
}

export function TopBar({ leftSlot, centerSlot, rightSlot }: TopBarProps) {
  return (
    <header
      className="sticky top-0 z-30 w-full backdrop-blur-md"
      style={{
        background: "var(--surface-glass)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
      role="banner"
    >
      <div className="mx-auto grid max-w-[1180px] grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-3">
        <div className="flex min-w-0 items-center">{leftSlot}</div>
        <div className="flex min-w-0 items-center">{centerSlot}</div>
        <div className="flex items-center gap-2">{rightSlot}</div>
      </div>
    </header>
  );
}
