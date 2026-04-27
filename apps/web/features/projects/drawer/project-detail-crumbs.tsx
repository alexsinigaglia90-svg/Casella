"use client";

import { useBreadcrumbs } from "@/features/admin-shell/breadcrumbs/use-breadcrumbs";

interface Props {
  name: string;
}

export function ProjectDetailCrumbs({ name }: Props) {
  useBreadcrumbs([
    { label: "Projecten", href: "/admin/projecten" },
    { label: `${name || "Project"} bewerken` },
  ]);
  return null;
}
