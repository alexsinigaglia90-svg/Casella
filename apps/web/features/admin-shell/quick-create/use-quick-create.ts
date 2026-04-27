"use client";

import { useEffect } from "react";

import { useQuickCreateCtx } from "./quick-create-context";

export function useQuickCreate(onTrigger: () => void, label = "Snel aanmaken"): void {
  const { setTrigger } = useQuickCreateCtx();
  useEffect(() => {
    setTrigger({ onTrigger, label });
    return () => setTrigger(null);
  }, [onTrigger, label, setTrigger]);
}
