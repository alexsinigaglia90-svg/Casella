"use client";

import { useBreadcrumbs } from "@/features/admin-shell/breadcrumbs/use-breadcrumbs";

export function UrenCrumbs() {
  useBreadcrumbs([{ label: "Uren goedkeuren", href: "/admin/uren" }]);
  return null;
}
