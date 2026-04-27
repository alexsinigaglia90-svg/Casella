"use client";

import type { LucideIcon } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

export interface KebabItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  destructive?: boolean;
}

export type TopBarAction =
  | { kind: "primary"; label: string; icon?: LucideIcon; onClick: () => void; shortcut?: string; trackingKey?: string }
  | { kind: "secondary"; label: string; icon?: LucideIcon; onClick: () => void }
  | { kind: "kebab"; items: KebabItem[] };

interface TopBarActionsCtx {
  actions: TopBarAction[];
  setActions: (a: TopBarAction[]) => void;
}

const TopBarActionsContext = createContext<TopBarActionsCtx | null>(null);

export function TopBarActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActionsState] = useState<TopBarAction[]>([]);
  const setActions = useCallback((a: TopBarAction[]) => setActionsState(a), []);
  return (
    <TopBarActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </TopBarActionsContext.Provider>
  );
}

export function useTopBarActionsCtx(): TopBarActionsCtx {
  const ctx = useContext(TopBarActionsContext);
  if (!ctx) throw new Error("useTopBarActionsCtx must be inside TopBarActionsProvider");
  return ctx;
}
