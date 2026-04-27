"use client";

import { useBreadcrumbs } from "@/features/admin-shell/breadcrumbs/use-breadcrumbs";

export function ProfileCrumbs() {
  useBreadcrumbs([{ label: "Mijn profiel" }]);
  return null;
}
