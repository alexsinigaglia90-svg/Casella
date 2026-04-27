import type { ProjectStatus } from "@casella/types";
import { Suspense } from "react";

import {
  countProjectsByStatus,
  listActiveClientsForPicker,
  listProjects,
} from "./queries";

import { ProjectDrawer } from "@/features/projects/drawer/project-drawer";
import { ProjectenCrumbs } from "@/features/projects/list/projecten-crumbs";
import { ProjectenPageActions } from "@/features/projects/list/projecten-page-actions";
import { ProjectsListShell } from "@/features/projects/list/projects-list-shell";

const VALID_STATUS = new Set(["all", "planned", "active", "completed", "cancelled"]);
const VALID_SORT = new Set(["name", "start", "created"]);
const VALID_DIR = new Set(["asc", "desc"]);

export default async function ProjectenPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
    dir?: string;
    cursor?: string;
    clientId?: string;
  }>;
}) {
  const params = await searchParams;

  const status =
    params.status && VALID_STATUS.has(params.status)
      ? (params.status as ProjectStatus | "all")
      : "all";

  const sort =
    params.sort && VALID_SORT.has(params.sort)
      ? (params.sort as "name" | "start" | "created")
      : "name";

  const dir =
    params.dir && VALID_DIR.has(params.dir)
      ? (params.dir as "asc" | "desc")
      : "asc";

  const [{ rows, nextCursor }, counts, clients] = await Promise.all([
    listProjects({
      search: params.q,
      status,
      sort,
      dir,
      cursor: params.cursor,
      clientId: params.clientId,
    }),
    countProjectsByStatus(),
    listActiveClientsForPicker(),
  ]);

  return (
    <>
      <ProjectenCrumbs />
      <ProjectenPageActions />
      <ProjectsListShell
        rows={rows}
        counts={counts}
        nextCursor={nextCursor}
        currentQuery={params.q ?? ""}
        currentStatus={status}
        currentSort={sort}
        currentDir={dir}
      />
      <Suspense fallback={null}>
        <ProjectDrawer clients={clients} />
      </Suspense>
    </>
  );
}
