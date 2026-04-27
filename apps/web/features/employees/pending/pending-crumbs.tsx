"use client";

import { useBreadcrumbs } from "@/features/admin-shell/breadcrumbs/use-breadcrumbs";

export function PendingCrumbs() {
  useBreadcrumbs([
    { label: "Medewerkers", href: "/admin/medewerkers" },
    { label: "Lopende beëindigingen" },
  ]);
  return null;
}
