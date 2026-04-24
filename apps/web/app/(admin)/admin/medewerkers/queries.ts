import { getDb, schema, and, asc, desc, eq, isNull, or, ilike, sql } from "@casella/db";
import type { EmploymentStatus } from "@casella/types";

export interface EmployeeListRow {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string | null;
  employmentStatus: string;
  startDate: string | null;
  endDate: string | null;
  userId: string | null;
  inviteEmail: string | null;
  city: string | null;
  pendingActions: number;
}

export interface EmployeeListParams {
  search?: string;
  status?: EmploymentStatus | "all";
  cursor?: string;
  limit?: number;
  sort?: "name" | "start";
  dir?: "asc" | "desc";
}

export async function listEmployees(params: EmployeeListParams): Promise<{
  rows: EmployeeListRow[];
  nextCursor: string | null;
}> {
  const limit = Math.min(params.limit ?? 50, 200);
  const sort = params.sort ?? "name";
  const dir = params.dir ?? "asc";

  const db = getDb();

  const conditions = [];

  if (params.status && params.status !== "all") {
    conditions.push(eq(schema.employees.employmentStatus, params.status));
  }

  if (params.search) {
    const pattern = `%${params.search}%`;
    conditions.push(
      or(
        ilike(schema.users.displayName, pattern),
        ilike(schema.users.email, pattern),
        ilike(schema.employees.inviteEmail, pattern),
        ilike(schema.employees.jobTitle, pattern),
      )
    );
  }

  // NB: cursor pagination assumes default sort (createdAt desc); sort=name|start resets to first page.
  if (params.cursor && !params.sort) {
    conditions.push(
      or(
        sql`${schema.employees.createdAt} < (SELECT created_at FROM employees WHERE id = ${params.cursor})`,
        and(
          sql`${schema.employees.createdAt} = (SELECT created_at FROM employees WHERE id = ${params.cursor})`,
          sql`${schema.employees.id} < ${params.cursor}`,
        ),
      )
    );
  }

  // Build orderBy based on sort key
  let orderBy;
  if (sort === "start") {
    orderBy = [
      dir === "desc" ? desc(schema.employees.startDate) : asc(schema.employees.startDate),
      desc(schema.employees.createdAt),
    ];
  } else {
    // sort === "name": order by displayName (coalesce of users.displayName, inviteEmail)
    const nameExpr = sql`coalesce(${schema.users.displayName}, ${schema.employees.inviteEmail}, '')`;
    orderBy = [
      dir === "desc" ? desc(nameExpr) : asc(nameExpr),
      desc(schema.employees.createdAt),
    ];
  }

  const rows = await db
    .select({
      id: schema.employees.id,
      displayName: sql<string>`coalesce(${schema.users.displayName}, ${schema.employees.inviteEmail}, '')`,
      email: sql<string>`coalesce(${schema.users.email}, ${schema.employees.inviteEmail}, '')`,
      jobTitle: schema.employees.jobTitle,
      employmentStatus: schema.employees.employmentStatus,
      startDate: schema.employees.startDate,
      endDate: schema.employees.endDate,
      userId: schema.employees.userId,
      inviteEmail: schema.employees.inviteEmail,
      city: schema.addresses.city,
    })
    .from(schema.employees)
    .leftJoin(schema.users, eq(schema.employees.userId, schema.users.id))
    .leftJoin(schema.addresses, eq(schema.employees.homeAddressId, schema.addresses.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(...orderBy)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

  // Attach pendingActions placeholder (0 for 1.1a; will be computed in a future plan)
  const rowsWithActions: EmployeeListRow[] = data.map((r) => ({
    ...r,
    city: r.city ?? null,
    pendingActions: 0,
  }));

  return { rows: rowsWithActions, nextCursor };
}

export interface EmployeeStatusCounts {
  all: number;
  active: number;
  on_leave: number;
  sick: number;
  terminated: number;
}

export async function countEmployeesByStatus(): Promise<EmployeeStatusCounts> {
  const db = getDb();
  const result = await db
    .select({
      status: schema.employees.employmentStatus,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(schema.employees)
    .groupBy(schema.employees.employmentStatus);

  const counts: EmployeeStatusCounts = { all: 0, active: 0, on_leave: 0, sick: 0, terminated: 0 };
  for (const row of result) {
    const s = row.status as keyof Omit<EmployeeStatusCounts, "all">;
    counts[s] = row.count;
    counts.all += row.count;
  }
  return counts;
}
