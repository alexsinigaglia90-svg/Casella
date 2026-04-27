"use client";

import { useBreadcrumbs } from "@/features/admin-shell/breadcrumbs/use-breadcrumbs";

export function ToewijzingenCrumbs() {
  useBreadcrumbs([{ label: "Toewijzingen", href: "/admin/toewijzingen" }]);
  return null;
}
