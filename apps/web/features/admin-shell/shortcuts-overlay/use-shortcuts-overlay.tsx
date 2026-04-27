"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { trackAction } from "../coaching/tracker";

interface ShortcutsCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const ShortcutsContext = createContext<ShortcutsCtx | null>(null);

function isInInputContext(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.matches('input, textarea, select, [contenteditable="true"]');
}

export function ShortcutsOverlayProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !isInInputContext(e.target)) {
        e.preventDefault();
        trackAction("usedShortcutsOverlay");
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <ShortcutsContext.Provider value={{ open, setOpen }}>
      {children}
    </ShortcutsContext.Provider>
  );
}

export function useShortcutsOverlay(): ShortcutsCtx {
  const ctx = useContext(ShortcutsContext);
  if (!ctx) throw new Error("useShortcutsOverlay must be inside ShortcutsOverlayProvider");
  return ctx;
}
