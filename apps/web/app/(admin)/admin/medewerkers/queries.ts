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
}

export interface EmployeeListParams {
  search?: string;
  status?: EmploymentStatus | "all";
  cursor?: string;
  limit?: number;
}

export async function listEmployees(params: EmployeeListParams): Promise<{
  rows: EmployeeListRow[];
  nextCursor: string | null;
}> {
  const limit = Math.min(params.limit ?? 50, 200);

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

  if (params.cursor) {
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
    })
    .from(schema.employees)
    .leftJoin(schema.users, eq(schema.employees.userId, schema.users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.employees.createdAt), desc(schema.employees.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

  return { rows: data, nextCursor };
}
