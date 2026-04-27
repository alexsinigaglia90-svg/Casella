"use client";

import { useEffect } from "react";

import type { TopBarAction } from "./context-actions-context";
import { useTopBarActionsCtx } from "./context-actions-context";

export function useTopBarActions(actions: TopBarAction[]): void {
  const { setActions } = useTopBarActionsCtx();
  const key = JSON.stringify(actions);
  useEffect(() => {
    setActions(actions);
    return () => setActions([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key is the stable dep
  }, [key]);
}
