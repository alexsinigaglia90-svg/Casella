"use client";

import { useBreadcrumbs } from "@/features/admin-shell/breadcrumbs/use-breadcrumbs";

interface Props {
  name: string;
}

export function ClientDetailCrumbs({ name }: Props) {
  useBreadcrumbs([
    { label: "Klanten", href: "/admin/klanten" },
    { label: `${name || "Klant"} bewerken` },
  ]);
  return null;
}
