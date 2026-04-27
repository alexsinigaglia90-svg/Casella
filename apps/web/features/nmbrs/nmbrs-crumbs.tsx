"use client";

import { useBreadcrumbs } from "@/features/admin-shell/breadcrumbs/use-breadcrumbs";

export function NmbrsCrumbs() {
  useBreadcrumbs([{ label: "Nmbrs sync", href: "/admin/nmbrs" }]);
  return null;
}
