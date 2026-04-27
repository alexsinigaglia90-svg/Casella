"use client";

import { useBreadcrumbs } from "@/features/admin-shell/breadcrumbs/use-breadcrumbs";

export function ProjectenCrumbs() {
  useBreadcrumbs([{ label: "Projecten", href: "/admin/projecten" }]);
  return null;
}
