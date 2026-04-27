"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { trackAction } from "../coaching/tracker";

interface QuickCreateTrigger {
  onTrigger: () => void;
  label: string;
}

interface QuickCreateCtx {
  trigger: QuickCreateTrigger | null;
  setTrigger: (t: QuickCreateTrigger | null) => void;
}

const QuickCreateContext = createContext<QuickCreateCtx | null>(null);

function isInInputContext(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.matches('input, textarea, select, [contenteditable="true"]');
}

export function QuickCreateProvider({ children }: { children: ReactNode }) {
  const [trigger, setTriggerState] = useState<QuickCreateTrigger | null>(null);
  const setTrigger = useCallback((t: QuickCreateTrigger | null) => setTriggerState(t), []);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isCmdN =
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === "n" &&
        !e.shiftKey &&
        !e.altKey;
      if (!isCmdN) return;
      if (isInInputContext(e.target)) return;
      if (!trigger) return;
      e.preventDefault();
      trackAction("usedCmdN");
      trigger.onTrigger();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [trigger]);

  return (
    <QuickCreateContext.Provider value={{ trigger, setTrigger }}>
      {children}
    </QuickCreateContext.Provider>
  );
}

export function useQuickCreateCtx(): QuickCreateCtx {
  const ctx = useContext(QuickCreateContext);
  if (!ctx) throw new Error("useQuickCreateCtx must be inside QuickCreateProvider");
  return ctx;
}
