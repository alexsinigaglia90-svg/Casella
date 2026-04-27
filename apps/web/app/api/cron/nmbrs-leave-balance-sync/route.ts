import { eq, getDb, schema } from "@casella/db";
import { NmbrsError, getLeaveBalancesByYear } from "@casella/nmbrs";
import { NextResponse, type NextRequest } from "next/server";

import { checkCronSecret } from "@/lib/cron/guard";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const guard = checkCronSecret(req);
  if (guard) return guard;

  const db = getDb();
  const now = new Date();
  const currentYear = now.getUTCFullYear();

  const employees = await db
    .select({
      id: schema.employees.id,
      nmbrsEmployeeId: schema.employees.nmbrsEmployeeId,
    })
    .from(schema.employees)
    .where(eq(schema.employees.employmentStatus, "active"));

  let processed = 0;
  let skipped = 0;

  for (const emp of employees) {
    if (!emp.nmbrsEmployeeId) {
      skipped++;
      continue;
    }

    let balances;
    try {
      balances = await getLeaveBalancesByYear(emp.nmbrsEmployeeId, currentYear);
    } catch (e) {
      if (
        e instanceof NmbrsError &&
        (e.code === "missing_credentials" || e.code === "not_implemented")
      ) {
        console.log("nmbrs-leave-balance-sync: skip", {
          employeeId: emp.id,
          code: e.code,
        });
        skipped++;
        continue;
      }
      console.error("nmbrs-leave-balance-sync: unexpected error", {
        employeeId: emp.id,
        error: e,
      });
      skipped++;
      continue;
    }

    for (const balance of balances) {
      // Delete then insert for upsert (no unique constraint available yet)
      await db
        .delete(schema.leaveBalanceSnapshots)
        .where(
          eq(schema.leaveBalanceSnapshots.employeeId, emp.id),
        );
      await db.insert(schema.leaveBalanceSnapshots).values({
        employeeId: emp.id,
        year: currentYear,
        leaveType: balance.leaveType,
        hoursTotal: String(balance.hoursTotal),
        hoursRemaining: String(balance.hoursRemaining),
        expiresAt: balance.expiresAt ?? null,
        syncedAt: now,
      });
    }

    processed++;
  }

  return NextResponse.json({ ok: true, processed, skipped });
}
