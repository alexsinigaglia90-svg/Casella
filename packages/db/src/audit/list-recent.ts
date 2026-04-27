import { desc, inArray } from "drizzle-orm";

import { getDb } from "../client";
import { auditLog } from "../schema/system";
import { employees, users } from "../schema/identity";

export interface AuditEvent {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName: string | null;
  actorUserId: string | null;
  actorName: string | null;
  changesJson: Record<string, unknown> | null;
  createdAt: Date;
}

interface ListAuditOpts {
  userId: string;
  limit?: number;
}

/**
 * Returns the most recent audit-log rows for the admin notification stream.
 * Resolves employee names (when resourceType = "employees") and actor display
 * names in batch lookups so the wire payload is self-contained.
 *
 * `userId` is currently unused — the stream is admin-wide. Reserved for future
 * per-user scoping (e.g. notifications-table or actorUserId filter).
 */
export async function listRecentAuditEvents({
  userId: _userId,
  limit = 20,
}: ListAuditOpts): Promise<AuditEvent[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      resourceType: auditLog.resourceType,
      resourceId: auditLog.resourceId,
      actorUserId: auditLog.actorUserId,
      changesJson: auditLog.changesJson,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);

  // Resolve employee names in batch.
  const employeeIds = rows
    .filter((r) => r.resourceType === "employees" && r.resourceId)
    .map((r) => r.resourceId);
  const empMap = new Map<string, string>();
  if (employeeIds.length > 0) {
    const empRows = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
      })
      .from(employees)
      .where(inArray(employees.id, employeeIds));
    for (const e of empRows) {
      const name =
        [e.firstName, e.lastName].filter(Boolean).join(" ") || "Medewerker";
      empMap.set(e.id, name);
    }
  }

  // Resolve actor names in batch.
  const actorIds = Array.from(
    new Set(
      rows
        .map((r) => r.actorUserId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const actorMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const actorRows = await db
      .select({
        id: users.id,
        displayName: users.displayName,
      })
      .from(users)
      .where(inArray(users.id, actorIds));
    for (const u of actorRows) {
      actorMap.set(u.id, u.displayName);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    resourceType: r.resourceType,
    resourceId: r.resourceId,
    resourceName:
      r.resourceType === "employees"
        ? (empMap.get(r.resourceId) ?? null)
        : null,
    actorUserId: r.actorUserId,
    actorName: r.actorUserId ? (actorMap.get(r.actorUserId) ?? null) : null,
    changesJson: (r.changesJson as Record<string, unknown> | null) ?? null,
    createdAt: r.createdAt,
  }));
}
