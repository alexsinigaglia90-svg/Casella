import { and, desc, eq } from "drizzle-orm";

import { getDb } from "../client";
import { employees } from "../schema/identity";
import { userPins } from "../schema/pins";

export interface PinRow {
  entityType: string;
  entityId: string;
  createdAt: Date;
  employeeFirstName: string | null;
  employeeLastName: string | null;
}

export async function listUserPins({
  userId,
  entityType,
  limit = 50,
}: {
  userId: string;
  entityType?: string;
  limit?: number;
}): Promise<PinRow[]> {
  const db = getDb();
  const where = entityType
    ? and(eq(userPins.userId, userId), eq(userPins.entityType, entityType))
    : eq(userPins.userId, userId);

  const rows = await db
    .select({
      entityType: userPins.entityType,
      entityId: userPins.entityId,
      createdAt: userPins.createdAt,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
    })
    .from(userPins)
    .leftJoin(employees, eq(userPins.entityId, employees.id))
    .where(where)
    .orderBy(desc(userPins.createdAt))
    .limit(limit);

  return rows;
}
