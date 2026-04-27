"use client";

import { useBreadcrumbs } from "@/features/admin-shell/breadcrumbs/use-breadcrumbs";

export function EmployeeDetailCrumbs({
  firstName,
  lastName,
}: {
  firstName: string | null;
  lastName: string | null;
}) {
  const name = [firstName, lastName].filter(Boolean).join(" ") || "Medewerker";
  useBreadcrumbs([
    { label: "Medewerkers", href: "/admin/medewerkers" },
    { label: `${name} bewerken` },
  ]);
  return null;
}
