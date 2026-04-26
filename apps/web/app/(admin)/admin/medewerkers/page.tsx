import type { EmploymentStatus } from "@casella/types";
import { Suspense } from "react";

import { listEmployees, countEmployeesByStatus } from "./queries";

import { EmployeeDrawer } from "@/features/employees/drawer/employee-drawer";
import { EmployeesListShell } from "@/features/employees/list/employees-list-shell";
import { readListPrefs } from "@/lib/list-prefs-cookie";

const VALID_STATUS = new Set(["active", "on_leave", "sick", "terminated", "all"]);
const VALID_SORT = new Set(["name", "start"]);
const VALID_DIR = new Set(["asc", "desc"]);

export default async function MedewerkersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; dir?: string; cursor?: string }>;
}) {
  const params = await searchParams;

  const status =
    params.status && VALID_STATUS.has(params.status)
      ? (params.status as EmploymentStatus | "all")
      : undefined;

  const sort =
    params.sort && VALID_SORT.has(params.sort)
      ? (params.sort as "name" | "start")
      : "name";

  const dir =
    params.dir && VALID_DIR.has(params.dir)
      ? (params.dir as "asc" | "desc")
      : "asc";

  const [{ rows, nextCursor }, counts, initialPrefs] = await Promise.all([
    listEmployees({ search: params.q, status, sort, dir, cursor: params.cursor }),
    countEmployeesByStatus(),
    readListPrefs(),
  ]);

  return (
    <>
      <EmployeesListShell
        rows={rows}
        counts={counts}
        nextCursor={nextCursor}
        currentQuery={params.q ?? ""}
        currentStatus={status ?? "all"}
        currentSort={sort}
        currentDir={dir}
        initialPrefs={initialPrefs}
      />
      <Suspense fallback={null}>
        <EmployeeDrawer />
      </Suspense>
    </>
  );
}
