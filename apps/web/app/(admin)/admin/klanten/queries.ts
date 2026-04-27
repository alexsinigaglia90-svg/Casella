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

export interface ClientListRow {
  id: string;
  name: string;
  kvk: string | null;
  contactName: string | null;
  contactEmail: string | null;
  city: string | null;
  archived: boolean;
  projectCount: number;
}

export interface ClientStatusCounts {
  all: number;
  active: number;
  archived: number;
}

export interface ClientListParams {
  search?: string;
  status?: "active" | "archived" | "all";
  cursor?: string;
  limit?: number;
  sort?: "name" | "created";
  dir?: "asc" | "desc";
}

export async function listClients(params: ClientListParams): Promise<{
  rows: ClientListRow[];
  nextCursor: string | null;
}> {
  const limit = Math.min(params.limit ?? 50, 200);
  const sort = params.sort ?? "name";
  const dir = params.dir ?? "asc";
  const status = params.status ?? "active";
  const db = getDb();

  const conditions = [];
  if (status === "active") {
    conditions.push(isNull(schema.clients.archivedAt));
  } else if (status === "archived") {
    conditions.push(sql`${schema.clients.archivedAt} IS NOT NULL`);
  }
  // status === "all": no archive filter

  if (params.search) {
    const pattern = `%${params.search}%`;
    const searchCondition = or(
      ilike(schema.clients.name, pattern),
      ilike(schema.clients.kvk, pattern),
      ilike(schema.clients.contactName, pattern),
      ilike(schema.clients.contactEmail, pattern),
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  const orderCol = sort === "name" ? schema.clients.name : schema.clients.createdAt;
  const orderFn = dir === "desc" ? desc : asc;

  const rows = await db
    .select({
      id: schema.clients.id,
      name: schema.clients.name,
      kvk: schema.clients.kvk,
      contactName: schema.clients.contactName,
      contactEmail: schema.clients.contactEmail,
      addressCity: schema.addresses.city,
      archivedAt: schema.clients.archivedAt,
      projectCount: sql<number>`(SELECT COUNT(*) FROM ${schema.projects} WHERE ${schema.projects.clientId} = ${schema.clients.id})`,
    })
    .from(schema.clients)
    .leftJoin(schema.addresses, eq(schema.clients.addressId, schema.addresses.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(orderFn(orderCol), desc(schema.clients.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const trimmed = hasMore ? rows.slice(0, limit) : rows;

  return {
    rows: trimmed.map((r) => ({
      id: r.id,
      name: r.name,
      kvk: r.kvk,
      contactName: r.contactName,
      contactEmail: r.contactEmail,
      city: r.addressCity,
      archived: r.archivedAt !== null,
      projectCount: Number(r.projectCount),
    })),
    nextCursor: hasMore ? (trimmed[trimmed.length - 1]?.id ?? null) : null,
  };
}

export async function countClientsByStatus(): Promise<ClientStatusCounts> {
  const db = getDb();
  const result = await db
    .select({
      active: sql<number>`cast(count(*) filter (where ${schema.clients.archivedAt} is null) as int)`,
      archived: sql<number>`cast(count(*) filter (where ${schema.clients.archivedAt} is not null) as int)`,
    })
    .from(schema.clients);

  const row = result[0] ?? { active: 0, archived: 0 };
  const active = Number(row.active);
  const archived = Number(row.archived);
  return { active, archived, all: active + archived };
}
