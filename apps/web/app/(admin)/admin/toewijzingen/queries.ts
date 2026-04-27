import {
  getDb,
  schema,
  and,
  asc,
  desc,
  eq,
  or,
  ilike,
  sql,
  gte,
  lte,
  gt,
  lt,
  isNull,
} from "@casella/db";

export interface AssignmentListRow {
  id: string;
  employeeId: string;
  employeeName: string;
  projectId: string;
  projectName: string;
  clientName: string;
  startDate: string | null;
  endDate: string | null;
  kmRateCents: number | null;
  compensationType: "auto" | "ov" | "none" | null;
  state: "current" | "past" | "future";
}

export type AssignmentFilter = "current" | "past" | "future" | "all";

export interface AssignmentStatusCounts {
  all: number;
  current: number;
  past: number;
  future: number;
}

export interface AssignmentListParams {
  search?: string;
  filter?: AssignmentFilter;
  cursor?: string;
  limit?: number;
  sort?: "employee" | "project" | "start";
  dir?: "asc" | "desc";
  employeeId?: string;
  projectId?: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function deriveState(
  start: string | null,
  end: string | null,
  today: string,
): "current" | "past" | "future" {
  if (start && start > today) return "future";
  if (end && end < today) return "past";
  return "current";
}

export async function listAssignments(
  params: AssignmentListParams,
): Promise<{
  rows: AssignmentListRow[];
  nextCursor: string | null;
}> {
  const limit = Math.min(params.limit ?? 50, 200);
  const sort = params.sort ?? "start";
  const dir = params.dir ?? "desc";
  const db = getDb();

  const today = todayIso();
  const conditions = [];

  if (params.employeeId) {
    conditions.push(
      eq(schema.projectAssignments.employeeId, params.employeeId),
    );
  }
  if (params.projectId) {
    conditions.push(eq(schema.projectAssignments.projectId, params.projectId));
  }

  if (params.filter === "current") {
    const startOk = or(
      isNull(schema.projectAssignments.startDate),
      lte(schema.projectAssignments.startDate, today),
    );
    const endOk = or(
      isNull(schema.projectAssignments.endDate),
      gte(schema.projectAssignments.endDate, today),
    );
    if (startOk && endOk) conditions.push(and(startOk, endOk)!);
  }
  if (params.filter === "past") {
    conditions.push(lt(schema.projectAssignments.endDate, today));
  }
  if (params.filter === "future") {
    conditions.push(gt(schema.projectAssignments.startDate, today));
  }

  if (params.search) {
    const pattern = `%${params.search}%`;
    const searchCondition = or(
      ilike(schema.projects.name, pattern),
      ilike(schema.clients.name, pattern),
      ilike(schema.users.displayName, pattern),
      ilike(schema.employees.firstName, pattern),
      ilike(schema.employees.lastName, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  const orderCol =
    sort === "employee"
      ? schema.users.displayName
      : sort === "project"
        ? schema.projects.name
        : schema.projectAssignments.startDate;
  const orderFn = dir === "desc" ? desc : asc;

  const rows = await db
    .select({
      id: schema.projectAssignments.id,
      projectId: schema.projectAssignments.projectId,
      employeeId: schema.projectAssignments.employeeId,
      startDate: schema.projectAssignments.startDate,
      endDate: schema.projectAssignments.endDate,
      kmRateCents: schema.projectAssignments.kmRateCents,
      compensationType: schema.projectAssignments.compensationType,
      projectName: schema.projects.name,
      clientName: schema.clients.name,
      employeeFirstName: schema.employees.firstName,
      employeeLastName: schema.employees.lastName,
      employeeDisplayName: schema.users.displayName,
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
    .leftJoin(
      schema.employees,
      eq(schema.projectAssignments.employeeId, schema.employees.id),
    )
    .leftJoin(schema.users, eq(schema.employees.userId, schema.users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      orderFn(orderCol),
      desc(schema.projectAssignments.createdAt),
    )
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const trimmed = hasMore ? rows.slice(0, limit) : rows;

  return {
    rows: trimmed.map((r) => {
      const empName =
        [r.employeeFirstName, r.employeeLastName]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        r.employeeDisplayName ||
        "Onbekend";
      return {
        id: r.id,
        employeeId: r.employeeId,
        employeeName: empName,
        projectId: r.projectId,
        projectName: r.projectName ?? "—",
        clientName: r.clientName ?? "—",
        startDate: r.startDate ?? null,
        endDate: r.endDate ?? null,
        kmRateCents: r.kmRateCents,
        compensationType: r.compensationType,
        state: deriveState(r.startDate ?? null, r.endDate ?? null, today),
      };
    }),
    nextCursor: hasMore ? (trimmed[trimmed.length - 1]?.id ?? null) : null,
  };
}

export async function countAssignmentsByFilter(): Promise<AssignmentStatusCounts> {
  const db = getDb();
  const today = todayIso();
  const result = await db
    .select({
      current: sql<number>`cast(count(*) filter (where (${schema.projectAssignments.startDate} is null or ${schema.projectAssignments.startDate} <= ${today}) and (${schema.projectAssignments.endDate} is null or ${schema.projectAssignments.endDate} >= ${today})) as int)`,
      past: sql<number>`cast(count(*) filter (where ${schema.projectAssignments.endDate} < ${today}) as int)`,
      future: sql<number>`cast(count(*) filter (where ${schema.projectAssignments.startDate} > ${today}) as int)`,
      all: sql<number>`cast(count(*) as int)`,
    })
    .from(schema.projectAssignments);

  const row = result[0] ?? { current: 0, past: 0, future: 0, all: 0 };
  return {
    current: Number(row.current),
    past: Number(row.past),
    future: Number(row.future),
    all: Number(row.all),
  };
}

export interface ProjectPickerOption {
  id: string;
  name: string;
  clientName: string;
  status: "planned" | "active" | "completed" | "cancelled";
}

/**
 * Lightweight projects list for the assignment wizard's projectId Combobox.
 * Active + planned only — completed/cancelled projects shouldn't accept new
 * assignments.
 */
export async function listActiveProjectsForPicker(): Promise<
  ProjectPickerOption[]
> {
  const db = getDb();
  const statusCondition = or(
    eq(schema.projects.status, "active"),
    eq(schema.projects.status, "planned"),
  );
  const rows = await db
    .select({
      id: schema.projects.id,
      name: schema.projects.name,
      clientName: schema.clients.name,
      status: schema.projects.status,
    })
    .from(schema.projects)
    .leftJoin(schema.clients, eq(schema.projects.clientId, schema.clients.id))
    .where(statusCondition)
    .orderBy(asc(schema.projects.name));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    clientName: r.clientName ?? "—",
    status: r.status,
  }));
}

export interface EmployeePickerOption {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  jobTitle: string | null;
}

/**
 * Lightweight employees list for the assignment wizard's employeeId Combobox.
 * Active employees only — terminated/on-leave shouldn't be assigned to new
 * projects.
 */
export async function listActiveEmployeesForPicker(): Promise<
  EmployeePickerOption[]
> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.employees.id,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
      displayName: schema.users.displayName,
      jobTitle: schema.employees.jobTitle,
    })
    .from(schema.employees)
    .leftJoin(schema.users, eq(schema.employees.userId, schema.users.id))
    .where(eq(schema.employees.employmentStatus, "active"))
    .orderBy(asc(schema.users.displayName));
  return rows.map((r) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    displayName: r.displayName,
    jobTitle: r.jobTitle,
  }));
}
