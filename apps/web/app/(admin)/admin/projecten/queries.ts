import {
  getDb,
  schema,
  and,
  asc,
  desc,
  eq,
  or,
  ilike,
  isNull,
  sql,
} from "@casella/db";
import type { ProjectStatus } from "@casella/types";

export interface ProjectListRow {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  assignmentCount: number;
}

export interface ProjectStatusCounts {
  all: number;
  planned: number;
  active: number;
  completed: number;
  cancelled: number;
}

export interface ProjectListParams {
  search?: string;
  status?: ProjectStatus | "all";
  cursor?: string;
  limit?: number;
  sort?: "name" | "start" | "created";
  dir?: "asc" | "desc";
  clientId?: string;
}

export async function listProjects(params: ProjectListParams): Promise<{
  rows: ProjectListRow[];
  nextCursor: string | null;
}> {
  const limit = Math.min(params.limit ?? 50, 200);
  const sort = params.sort ?? "name";
  const dir = params.dir ?? "asc";
  const db = getDb();

  const conditions = [];
  if (params.status && params.status !== "all") {
    conditions.push(eq(schema.projects.status, params.status));
  }
  if (params.clientId) {
    conditions.push(eq(schema.projects.clientId, params.clientId));
  }
  if (params.search) {
    const pattern = `%${params.search}%`;
    const searchCondition = or(
      ilike(schema.projects.name, pattern),
      ilike(schema.projects.description, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  const orderCol =
    sort === "name"
      ? schema.projects.name
      : sort === "start"
        ? schema.projects.startDate
        : schema.projects.createdAt;
  const orderFn = dir === "desc" ? desc : asc;

  const rows = await db
    .select({
      id: schema.projects.id,
      name: schema.projects.name,
      clientId: schema.projects.clientId,
      clientName: schema.clients.name,
      status: schema.projects.status,
      startDate: schema.projects.startDate,
      endDate: schema.projects.endDate,
      assignmentCount: sql<number>`(SELECT COUNT(*) FROM ${schema.projectAssignments} WHERE ${schema.projectAssignments.projectId} = ${schema.projects.id})`,
    })
    .from(schema.projects)
    .leftJoin(schema.clients, eq(schema.projects.clientId, schema.clients.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(orderFn(orderCol), desc(schema.projects.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const trimmed = hasMore ? rows.slice(0, limit) : rows;

  return {
    rows: trimmed.map((r) => ({
      id: r.id,
      name: r.name,
      clientId: r.clientId,
      clientName: r.clientName ?? "—",
      status: r.status,
      startDate: r.startDate ?? null,
      endDate: r.endDate ?? null,
      assignmentCount: Number(r.assignmentCount),
    })),
    nextCursor: hasMore ? (trimmed[trimmed.length - 1]?.id ?? null) : null,
  };
}

export async function countProjectsByStatus(): Promise<ProjectStatusCounts> {
  const db = getDb();
  const result = await db
    .select({
      planned: sql<number>`cast(count(*) filter (where ${schema.projects.status} = 'planned') as int)`,
      active: sql<number>`cast(count(*) filter (where ${schema.projects.status} = 'active') as int)`,
      completed: sql<number>`cast(count(*) filter (where ${schema.projects.status} = 'completed') as int)`,
      cancelled: sql<number>`cast(count(*) filter (where ${schema.projects.status} = 'cancelled') as int)`,
    })
    .from(schema.projects);

  const row = result[0] ?? { planned: 0, active: 0, completed: 0, cancelled: 0 };
  const planned = Number(row.planned);
  const active = Number(row.active);
  const completed = Number(row.completed);
  const cancelled = Number(row.cancelled);
  return {
    planned,
    active,
    completed,
    cancelled,
    all: planned + active + completed + cancelled,
  };
}

export interface ClientPickerOption {
  id: string;
  name: string;
}

/**
 * Lightweight active-clients list for the project wizard's clientId
 * Combobox. Filters out archived clients server-side; ordered by name.
 */
export async function listActiveClientsForPicker(): Promise<ClientPickerOption[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.clients.id,
      name: schema.clients.name,
    })
    .from(schema.clients)
    .where(isNull(schema.clients.archivedAt))
    .orderBy(asc(schema.clients.name));
  return rows;
}
