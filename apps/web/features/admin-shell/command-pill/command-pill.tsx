"use client";

import { Search } from "lucide-react";

import { usePalette } from "@/features/admin-shell/command-palette/palette-context";

export function CommandPill() {
  const { setOpen } = usePalette();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Open command palette (⌘K)"
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        border: "1px solid var(--border-subtle)",
        background: "var(--surface-base)",
        color: "var(--fg-tertiary)",
      }}
    >
      <Search className="size-3.5" aria-hidden />
      <span className="hidden md:inline">Zoek of voer uit…</span>
      <kbd
        className="ml-2 hidden rounded px-1.5 py-0.5 font-mono text-[10px] md:inline"
        style={{ background: "var(--surface-deep)", color: "var(--fg-tertiary)" }}
      >
        ⌘K
      </kbd>
    </button>
  );
}
