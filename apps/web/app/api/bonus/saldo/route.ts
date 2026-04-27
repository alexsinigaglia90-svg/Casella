import { and, eq, getDb, gte, lte, schema, sql } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse } from "next/server";

import { getCurrentEmployee } from "@/lib/current-employee";

export const dynamic = "force-dynamic";

export async function GET() {
  const employee = await getCurrentEmployee();
  if (!employee) {
    return NextResponse.json(
      apiError("unauthenticated", "Niet ingelogd"),
      { status: 401 },
    );
  }

  const db = getDb();
  const year = new Date().getUTCFullYear();
  const yearStart = new Date(`${year}-01-01T00:00:00Z`);
  const yearEnd = new Date(`${year}-12-31T23:59:59Z`);

  const aggRows = await db
    .select({
      type: schema.bonusLedger.type,
      total: sql<string>`SUM(${schema.bonusLedger.amountCents})`,
    })
    .from(schema.bonusLedger)
    .where(
      and(
        eq(schema.bonusLedger.employeeId, employee.id),
        gte(schema.bonusLedger.createdAt, yearStart),
        lte(schema.bonusLedger.createdAt, yearEnd),
      ),
    )
    .groupBy(schema.bonusLedger.type);

  let ytdAccrualCents = 0;
  let ytdAdjustmentCents = 0;
  let ytdPaidCents = 0;
  for (const row of aggRows) {
    const total = parseInt(row.total ?? "0", 10);
    if (row.type === "accrual") ytdAccrualCents = total;
    else if (row.type === "adjustment") ytdAdjustmentCents = total;
    else if (row.type === "payout") ytdPaidCents = Math.abs(total);
  }
  const totalEarned = ytdAccrualCents + ytdAdjustmentCents;
  const outstandingCents = totalEarned - ytdPaidCents;

  // Per project (accrual rows only).
  const perProjectRows = await db
    .select({
      projectId: schema.bonusLedger.projectId,
      total: sql<string>`SUM(${schema.bonusLedger.amountCents})`,
    })
    .from(schema.bonusLedger)
    .where(
      and(
        eq(schema.bonusLedger.employeeId, employee.id),
        eq(schema.bonusLedger.type, "accrual"),
        gte(schema.bonusLedger.createdAt, yearStart),
        lte(schema.bonusLedger.createdAt, yearEnd),
      ),
    )
    .groupBy(schema.bonusLedger.projectId);

  const projectIds = perProjectRows
    .map((r) => r.projectId)
    .filter((v): v is string => Boolean(v));
  const projectMap = new Map<string, string>();
  if (projectIds.length > 0) {
    const projects = await db
      .select({ id: schema.projects.id, name: schema.projects.name })
      .from(schema.projects);
    for (const p of projects) projectMap.set(p.id, p.name);
  }

  const perProject = perProjectRows.map((r) => ({
    projectId: r.projectId,
    projectName: r.projectId ? (projectMap.get(r.projectId) ?? "—") : "Onbekend",
    accrualCents: parseInt(r.total ?? "0", 10),
  }));

  return NextResponse.json({
    year,
    ytdAccrualCents: totalEarned,
    ytdPaidCents,
    outstandingCents,
    perProject,
  });
}
