"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

export type SwitcherScope = "parent-medewerkers" | "current-employee";

export interface CrumbSwitcher {
  scope: SwitcherScope;
  currentId?: string;
}

export interface Crumb {
  label: string;
  href?: string;
  switcher?: CrumbSwitcher;
}

interface BreadcrumbCtx {
  crumbs: Crumb[];
  setCrumbs: (c: Crumb[]) => void;
}

const BreadcrumbContext = createContext<BreadcrumbCtx | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const set = useCallback((c: Crumb[]) => setCrumbs(c), []);
  return (
    <BreadcrumbContext.Provider value={{ crumbs, setCrumbs: set }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbCtx(): BreadcrumbCtx {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) throw new Error("useBreadcrumbCtx must be used within BreadcrumbProvider");
  return ctx;
}
