import "server-only";

import { getDb, schema, desc, eq } from "@casella/db";

export type NmbrsSyncType = "employees" | "hours" | "leave";
export type NmbrsSyncStatus = "running" | "success" | "failure";

export interface NmbrsSyncRunRow {
  id: string;
  syncType: NmbrsSyncType;
  status: NmbrsSyncStatus;
  startedAt: string;
  finishedAt: string | null;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errorMessage: string | null;
  triggeredBy: string | null;
}

function toRow(r: typeof schema.nmbrsSyncRuns.$inferSelect): NmbrsSyncRunRow {
  return {
    id: r.id,
    syncType: r.syncType,
    status: r.status,
    startedAt: r.startedAt.toISOString(),
    finishedAt: r.finishedAt?.toISOString() ?? null,
    recordsProcessed: r.recordsProcessed,
    recordsSucceeded: r.recordsSucceeded,
    recordsFailed: r.recordsFailed,
    errorMessage: r.errorMessage,
    triggeredBy: r.triggeredBy,
  };
}

export async function listSyncRuns(limit = 30): Promise<NmbrsSyncRunRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.nmbrsSyncRuns)
    .orderBy(desc(schema.nmbrsSyncRuns.startedAt))
    .limit(limit);
  return rows.map(toRow);
}

export async function getLatestSyncByType(): Promise<
  Record<NmbrsSyncType, NmbrsSyncRunRow | null>
> {
  const db = getDb();
  const types: NmbrsSyncType[] = ["employees", "hours", "leave"];
  const result: Record<NmbrsSyncType, NmbrsSyncRunRow | null> = {
    employees: null,
    hours: null,
    leave: null,
  };
  for (const t of types) {
    const [r] = await db
      .select()
      .from(schema.nmbrsSyncRuns)
      .where(eq(schema.nmbrsSyncRuns.syncType, t))
      .orderBy(desc(schema.nmbrsSyncRuns.startedAt))
      .limit(1);
    result[t] = r ? toRow(r) : null;
  }
  return result;
}
