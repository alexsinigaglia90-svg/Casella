import { Suspense } from "react";

import { listClients, countClientsByStatus } from "./queries";

import { ClientDrawer } from "@/features/clients/drawer/client-drawer";
import { ClientsListShell } from "@/features/clients/list/clients-list-shell";
import { KlantenCrumbs } from "@/features/clients/list/klanten-crumbs";
import { KlantenPageActions } from "@/features/clients/list/klanten-page-actions";
import { readClientListPrefs } from "@/lib/client-list-prefs";

const VALID_STATUS = new Set(["active", "archived", "all"]);
const VALID_SORT = new Set(["name", "created"]);
const VALID_DIR = new Set(["asc", "desc"]);

export default async function KlantenPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
    dir?: string;
    cursor?: string;
  }>;
}) {
  const params = await searchParams;

  const status =
    params.status && VALID_STATUS.has(params.status)
      ? (params.status as "active" | "archived" | "all")
      : "active";

  const sort =
    params.sort && VALID_SORT.has(params.sort)
      ? (params.sort as "name" | "created")
      : "name";

  const dir =
    params.dir && VALID_DIR.has(params.dir)
      ? (params.dir as "asc" | "desc")
      : "asc";

  const [{ rows, nextCursor }, counts, initialPrefs] = await Promise.all([
    listClients({ search: params.q, status, sort, dir, cursor: params.cursor }),
    countClientsByStatus(),
    readClientListPrefs(),
  ]);

  return (
    <>
      <KlantenCrumbs />
      <KlantenPageActions />
      <ClientsListShell
        rows={rows}
        counts={counts}
        nextCursor={nextCursor}
        currentQuery={params.q ?? ""}
        currentStatus={status}
        currentSort={sort}
        currentDir={dir}
        initialPrefs={initialPrefs}
      />
      <Suspense fallback={null}>
        <ClientDrawer />
      </Suspense>
    </>
  );
}
