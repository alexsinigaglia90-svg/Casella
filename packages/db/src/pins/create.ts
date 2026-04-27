import { auditMutation, type DbTransaction } from "../audit";
import { getDb } from "../client";
import { userPins } from "../schema/pins";

export async function createPin({
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
      .insert(userPins)
      .values({ userId, entityType, entityId })
      .onConflictDoNothing();
    await auditMutation(tx, {
      actorUserId: userId,
      action: "pin.create",
      resourceType: entityType,
      resourceId: entityId,
    });
  });
}
