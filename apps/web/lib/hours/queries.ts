import "server-only";

import {
  getDb,
  schema,
  and,
  asc,
  eq,
  gte,
  lte,
  or,
  isNull,
  sql,
} from "@casella/db";
import type { HourEntryEnriched } from "@casella/types";

export interface WeekData {
  weekStart: string;
  entries: HourEntryEnriched[];
  status: "draft" | "submitted" | "approved" | "rejected" | "mixed" | "empty";
}

function asIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getEmployeeWeek(
  employeeId: string,
  weekStartIso: string,
): Promise<WeekData> {
  const db = getDb();
  const start = new Date(weekStartIso);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const endIso = asIso(end);

  const rows = await db
    .select({
      e: schema.hourEntries,
      projectName: schema.projects.name,
      clientName: schema.clients.name,
    })
    .from(schema.hourEntries)
    .leftJoin(
      schema.projects,
      eq(schema.hourEntries.projectId, schema.projects.id),
    )
    .leftJoin(
      schema.clients,
      eq(schema.projects.clientId, schema.clients.id),
    )
    .where(
      and(
        eq(schema.hourEntries.employeeId, employeeId),
        gte(schema.hourEntries.workDate, weekStartIso),
        lte(schema.hourEntries.workDate, endIso),
      ),
    );

  const entries: HourEntryEnriched[] = rows.map((r) => ({
    id: r.e.id,
    employeeId: r.e.employeeId,
    projectId: r.e.projectId,
    workDate: r.e.workDate,
    hours: r.e.hours,
    kmCached: r.e.kmCached,
    notes: r.e.notes,
    status: r.e.status,
    submittedAt: r.e.submittedAt?.toISOString() ?? null,
    approvedAt: r.e.approvedAt?.toISOString() ?? null,
    approvedBy: r.e.approvedBy,
    rejectionReason: r.e.rejectionReason,
    nmbrsSyncedAt: r.e.nmbrsSyncedAt?.toISOString() ?? null,
    createdAt: r.e.createdAt.toISOString(),
    updatedAt: r.e.updatedAt.toISOString(),
    projectName: r.projectName ?? "—",
    clientName: r.clientName ?? "—",
    employeeName: "self",
  }));

  const statuses = new Set(entries.map((e) => e.status));
  let status: WeekData["status"] = "empty";
  if (statuses.size === 1) status = [...statuses][0]!;
  else if (statuses.size > 1) status = "mixed";

  return { weekStart: weekStartIso, entries, status };
}

export async function getEmployeeProjectsForWeek(
  employeeId: string,
  weekStartIso: string,
) {
  const db = getDb();
  const end = new Date(weekStartIso);
  end.setDate(end.getDate() + 6);
  const endIso = asIso(end);

  return db
    .select({
      id: schema.projects.id,
      name: schema.projects.name,
      clientName: schema.clients.name,
      kmRateCents: schema.projectAssignments.kmRateCents,
      compensationType: schema.projectAssignments.compensationType,
      assignmentStart: schema.projectAssignments.startDate,
      assignmentEnd: schema.projectAssignments.endDate,
    })
    .from(schema.projectAssignments)
    .leftJoin(
      schema.projects,
      eq(schema.projectAssignments.projectId, schema.projects.id),
    )
    .leftJoin(
      schema.clients,
      eq(schema.projects.clientId, schema.clients.id),
    )
    .where(
      and(
        eq(schema.projectAssignments.employeeId, employeeId),
        or(
          isNull(schema.projectAssignments.startDate),
          lte(schema.projectAssignments.startDate, endIso),
        ),
        or(
          isNull(schema.projectAssignments.endDate),
          gte(schema.projectAssignments.endDate, weekStartIso),
        ),
      ),
    )
    .orderBy(asc(schema.projects.name));
}

export interface PendingApprovalRow {
  employeeId: string;
  employeeName: string;
  weekStart: string;
  totalHours: number;
  entryCount: number;
  submittedAt: string;
}

type RawPendingRow = {
  employee_id: string;
  employee_name: string;
  week_start: string | Date;
  total_hours: string | number;
  entry_count: string | number;
  submitted_at: string | Date;
} & Record<string, unknown>;

export async function listPendingApprovals(): Promise<PendingApprovalRow[]> {
  const db = getDb();
  const rows = await db.execute<RawPendingRow>(sql`
    SELECT
      e.id as employee_id,
      COALESCE(NULLIF(TRIM(CONCAT_WS(' ', e.first_name, e.last_name)), ''), u.display_name) as employee_name,
      DATE_TRUNC('week', he.work_date)::date as week_start,
      SUM(he.hours) as total_hours,
      COUNT(*) as entry_count,
      MIN(he.submitted_at) as submitted_at
    FROM hour_entries he
    JOIN employees e ON he.employee_id = e.id
    LEFT JOIN users u ON e.user_id = u.id
    WHERE he.status = 'submitted'
    GROUP BY e.id, employee_name, week_start
    ORDER BY MIN(he.submitted_at) ASC
  `);

  const rawRows = rows as unknown as RawPendingRow[];

  return rawRows.map((r) => ({
    employeeId: r.employee_id,
    employeeName: r.employee_name,
    weekStart:
      typeof r.week_start === "string"
        ? r.week_start
        : r.week_start.toISOString().slice(0, 10),
    totalHours: Number(r.total_hours),
    entryCount: Number(r.entry_count),
    submittedAt:
      typeof r.submitted_at === "string"
        ? r.submitted_at
        : r.submitted_at.toISOString(),
  }));
}
