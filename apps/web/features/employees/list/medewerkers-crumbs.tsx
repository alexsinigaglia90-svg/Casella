"use client";

import { useBreadcrumbs } from "@/features/admin-shell/breadcrumbs/use-breadcrumbs";

export function MedewerkersCrumbs() {
  useBreadcrumbs([{ label: "Medewerkers", href: "/admin/medewerkers" }]);
  return null;
}
