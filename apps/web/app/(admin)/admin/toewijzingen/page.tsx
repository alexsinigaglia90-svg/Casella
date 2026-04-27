import { Suspense } from "react";

import {
  countAssignmentsByFilter,
  listActiveEmployeesForPicker,
  listActiveProjectsForPicker,
  listAssignments,
  type AssignmentFilter,
} from "./queries";

import { AssignmentDrawer } from "@/features/assignments/drawer/assignment-drawer";
import { AssignmentsListShell } from "@/features/assignments/list/assignments-list-shell";
import { ToewijzingenCrumbs } from "@/features/assignments/list/toewijzingen-crumbs";
import { ToewijzingenPageActions } from "@/features/assignments/list/toewijzingen-page-actions";

const VALID_FILTER = new Set(["current", "past", "future", "all"]);
const VALID_SORT = new Set(["employee", "project", "start"]);
const VALID_DIR = new Set(["asc", "desc"]);

export default async function ToewijzingenPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    filter?: string;
    sort?: string;
    dir?: string;
    cursor?: string;
    employeeId?: string;
    projectId?: string;
  }>;
}) {
  const params = await searchParams;

  const filter: AssignmentFilter =
    params.filter && VALID_FILTER.has(params.filter)
      ? (params.filter as AssignmentFilter)
      : "current";

  const sort =
    params.sort && VALID_SORT.has(params.sort)
      ? (params.sort as "employee" | "project" | "start")
      : "start";

  const dir =
    params.dir && VALID_DIR.has(params.dir)
      ? (params.dir as "asc" | "desc")
      : "desc";

  const [{ rows, nextCursor }, counts, projects, employees] = await Promise.all(
    [
      listAssignments({
        search: params.q,
        filter,
        sort,
        dir,
        cursor: params.cursor,
        employeeId: params.employeeId,
        projectId: params.projectId,
      }),
      countAssignmentsByFilter(),
      listActiveProjectsForPicker(),
      listActiveEmployeesForPicker(),
    ],
  );

  return (
    <>
      <ToewijzingenCrumbs />
      <ToewijzingenPageActions />
      <AssignmentsListShell
        rows={rows}
        counts={counts}
        nextCursor={nextCursor}
        currentQuery={params.q ?? ""}
        currentFilter={filter}
        currentSort={sort}
        currentDir={dir}
      />
      <Suspense fallback={null}>
        <AssignmentDrawer projects={projects} employees={employees} />
      </Suspense>
    </>
  );
}
