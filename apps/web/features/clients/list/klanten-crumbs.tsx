"use client";

import { useBreadcrumbs } from "@/features/admin-shell/breadcrumbs/use-breadcrumbs";

export function KlantenCrumbs() {
  useBreadcrumbs([{ label: "Klanten", href: "/admin/klanten" }]);
  return null;
}
