import "server-only";

import { getDb, schema, eq, and, isNull, isNotNull } from "@casella/db";
import {
  listEmployeesByCompany,
  pushHourComponentInsert,
  NmbrsError,
} from "@casella/nmbrs";

export type NmbrsSyncType = "employees" | "hours" | "leave";

export interface SyncRunResult {
  runId: string;
  status: "success" | "failure";
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errorMessage?: string;
}

async function startRun(
  syncType: NmbrsSyncType,
  triggeredBy: string | null,
): Promise<string> {
  const db = getDb();
  const [run] = await db
    .insert(schema.nmbrsSyncRuns)
    .values({
      syncType,
      status: "running",
      triggeredBy,
    })
    .returning({ id: schema.nmbrsSyncRuns.id });
  if (!run) {
    throw new Error("Kon sync-run niet aanmaken");
  }
  return run.id;
}

interface FinishPartial {
  status: "success" | "failure";
  recordsProcessed?: number;
  recordsSucceeded?: number;
  recordsFailed?: number;
  errorMessage?: string;
  errorDetails?: unknown;
}

async function finishRun(runId: string, partial: FinishPartial): Promise<void> {
  const db = getDb();
  await db
    .update(schema.nmbrsSyncRuns)
    .set({
      status: partial.status,
      recordsProcessed: partial.recordsProcessed ?? 0,
      recordsSucceeded: partial.recordsSucceeded ?? 0,
      recordsFailed: partial.recordsFailed ?? 0,
      errorMessage: partial.errorMessage ?? null,
      errorDetails: partial.errorDetails ?? null,
      finishedAt: new Date(),
    })
    .where(eq(schema.nmbrsSyncRuns.id, runId));
}

function describeError(e: unknown): string {
  if (e instanceof NmbrsError) return `[${e.code}] ${e.message}`;
  if (e instanceof Error) return e.message;
  return "onbekende fout";
}

export async function pullEmployees(
  triggeredBy: string | null = null,
): Promise<SyncRunResult> {
  const runId = await startRun("employees", triggeredBy);
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    const remote = await listEmployeesByCompany();
    processed = remote.length;
    const db = getDb();

    for (const emp of remote) {
      try {
        const [existing] = await db
          .select()
          .from(schema.employees)
          .where(eq(schema.employees.nmbrsEmployeeId, emp.nmbrsId))
          .limit(1);

        if (existing) {
          // Refresh display fields when missing locally
          if (
            emp.displayName &&
            (existing.firstName === null || existing.lastName === null)
          ) {
            const [first, ...rest] = emp.displayName.split(" ");
            await db
              .update(schema.employees)
              .set({
                firstName: existing.firstName ?? first ?? null,
                lastName: existing.lastName ?? (rest.join(" ") || null),
              })
              .where(eq(schema.employees.id, existing.id));
          }
        } else {
          const [first, ...rest] = (emp.displayName ?? "").split(" ");
          await db.insert(schema.employees).values({
            inviteEmail: null,
            nmbrsEmployeeId: emp.nmbrsId,
            firstName: first || null,
            lastName: rest.join(" ") || null,
          });
        }
        succeeded++;
      } catch (e) {
        failed++;
        console.error("nmbrs pullEmployees per-row failed", e);
      }
    }

    const status = failed === 0 ? "success" : "failure";
    await finishRun(runId, {
      status,
      recordsProcessed: processed,
      recordsSucceeded: succeeded,
      recordsFailed: failed,
    });
    return {
      runId,
      status,
      recordsProcessed: processed,
      recordsSucceeded: succeeded,
      recordsFailed: failed,
    };
  } catch (e) {
    const msg = describeError(e);
    await finishRun(runId, {
      status: "failure",
      recordsProcessed: processed,
      recordsSucceeded: succeeded,
      recordsFailed: failed,
      errorMessage: msg,
      errorDetails: { error: String(e) },
    });
    return {
      runId,
      status: "failure",
      recordsProcessed: processed,
      recordsSucceeded: succeeded,
      recordsFailed: failed,
      errorMessage: msg,
    };
  }
}

function isoWeekOf(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
}

export async function pushApprovedHours(
  triggeredBy: string | null = null,
): Promise<SyncRunResult> {
  const runId = await startRun("hours", triggeredBy);
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  try {
    const db = getDb();
    const rows = await db
      .select({
        entryId: schema.hourEntries.id,
        workDate: schema.hourEntries.workDate,
        hours: schema.hourEntries.hours,
        nmbrsId: schema.employees.nmbrsEmployeeId,
      })
      .from(schema.hourEntries)
      .leftJoin(
        schema.employees,
        eq(schema.hourEntries.employeeId, schema.employees.id),
      )
      .where(
        and(
          eq(schema.hourEntries.status, "approved"),
          isNull(schema.hourEntries.nmbrsSyncedAt),
          isNotNull(schema.employees.nmbrsEmployeeId),
        ),
      );

    processed = rows.length;

    for (const row of rows) {
      if (!row.nmbrsId) {
        failed++;
        continue;
      }
      try {
        const date = new Date(row.workDate);
        const year = date.getFullYear();
        const week = isoWeekOf(date);
        await pushHourComponentInsert({
          nmbrsEmployeeId: row.nmbrsId,
          year,
          weekOrPeriod: week,
          hours: Number(row.hours),
          hourCodeId: 1,
        });
        await db
          .update(schema.hourEntries)
          .set({ nmbrsSyncedAt: new Date() })
          .where(eq(schema.hourEntries.id, row.entryId));
        succeeded++;
      } catch (e) {
        failed++;
        console.error("nmbrs pushApprovedHours per-row failed", e);
      }
    }

    const status = failed === 0 ? "success" : "failure";
    await finishRun(runId, {
      status,
      recordsProcessed: processed,
      recordsSucceeded: succeeded,
      recordsFailed: failed,
    });
    return {
      runId,
      status,
      recordsProcessed: processed,
      recordsSucceeded: succeeded,
      recordsFailed: failed,
    };
  } catch (e) {
    const msg = describeError(e);
    await finishRun(runId, {
      status: "failure",
      recordsProcessed: processed,
      recordsSucceeded: succeeded,
      recordsFailed: failed,
      errorMessage: msg,
      errorDetails: { error: String(e) },
    });
    return {
      runId,
      status: "failure",
      recordsProcessed: processed,
      recordsSucceeded: succeeded,
      recordsFailed: failed,
      errorMessage: msg,
    };
  }
}

export async function pushApprovedLeave(
  triggeredBy: string | null = null,
): Promise<SyncRunResult> {
  // Skeleton — full leave/sick wiring in Fase 1.4.
  // Tracks the run so the dashboard reflects activity.
  const runId = await startRun("leave", triggeredBy);
  await finishRun(runId, {
    status: "success",
    recordsProcessed: 0,
    recordsSucceeded: 0,
    recordsFailed: 0,
  });
  return {
    runId,
    status: "success",
    recordsProcessed: 0,
    recordsSucceeded: 0,
    recordsFailed: 0,
  };
}
