"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

export interface CachedEmployee {
  id: string;
  displayName: string;
  jobTitle: string | null;
}

interface EmployeeListCacheCtx {
  employees: CachedEmployee[];
  setEmployees: (e: CachedEmployee[]) => void;
}

const EmployeeListCacheContext = createContext<EmployeeListCacheCtx | null>(null);

export function EmployeeListCacheProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployeesState] = useState<CachedEmployee[]>([]);
  const setEmployees = useCallback((e: CachedEmployee[]) => setEmployeesState(e), []);
  return (
    <EmployeeListCacheContext.Provider value={{ employees, setEmployees }}>
      {children}
    </EmployeeListCacheContext.Provider>
  );
}

export function useEmployeeListCache(): EmployeeListCacheCtx {
  const ctx = useContext(EmployeeListCacheContext);
  if (!ctx) throw new Error("useEmployeeListCache must be inside EmployeeListCacheProvider");
  return ctx;
}
