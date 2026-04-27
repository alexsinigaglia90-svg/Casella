"use client";

import { useBreadcrumbs } from "@/features/admin-shell/breadcrumbs/use-breadcrumbs";

interface Props {
  employeeName: string;
  projectName: string;
}

export function AssignmentDetailCrumbs({ employeeName, projectName }: Props) {
  useBreadcrumbs([
    { label: "Toewijzingen", href: "/admin/toewijzingen" },
    { label: `${employeeName} → ${projectName}` },
  ]);
  return null;
}
