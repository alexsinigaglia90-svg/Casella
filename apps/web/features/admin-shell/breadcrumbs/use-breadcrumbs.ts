"use client";

import { useEffect } from "react";

import type { Crumb } from "./breadcrumb-context";
import { useBreadcrumbCtx } from "./breadcrumb-context";

export function useBreadcrumbs(crumbs: Crumb[]): void {
  const { setCrumbs } = useBreadcrumbCtx();
  const key = JSON.stringify(crumbs);
  useEffect(() => {
    setCrumbs(crumbs);
    return () => setCrumbs([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key is the stable dep
  }, [key]);
}
