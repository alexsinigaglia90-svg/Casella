"use client";

import { useBreadcrumbs } from "@/features/admin-shell/breadcrumbs/use-breadcrumbs";

interface Props {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

export function EmployeeDetailCrumbs({ id, firstName, lastName }: Props) {
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Medewerker";
  useBreadcrumbs([
    {
      label: "Medewerkers",
      href: "/admin/medewerkers",
      switcher: { scope: "parent-medewerkers", currentId: id },
    },
    {
      label: `${name} bewerken`,
      switcher: { scope: "current-employee", currentId: id },
    },
  ]);
  return null;
}
