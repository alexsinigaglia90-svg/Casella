import { and, eq } from "drizzle-orm";

import { auditMutation, type DbTransaction } from "../audit";
import { getDb } from "../client";
import { userPins } from "../schema/pins";

export async function deletePin({
  userId,
  entityType,
  entityId,
}: {
  userId: string;
  entityType: string;
  entityId: string;
}): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx: DbTransaction) => {
    await tx
      .delete(userPins)
      .where(
        and(
          eq(userPins.userId, userId),
          eq(userPins.entityType, entityType),
          eq(userPins.entityId, entityId),
        ),
      );
    await auditMutation(tx, {
      actorUserId: userId,
      action: "pin.delete",
      resourceType: entityType,
      resourceId: entityId,
    });
  });
}
