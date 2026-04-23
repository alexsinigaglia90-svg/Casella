import { eq } from "drizzle-orm";
import { getDb, schema } from "@casella/db";
import type { Role } from "@casella/types";

export interface EntraProfile {
  oid: string;
  email: string;
  displayName: string;
  role: Role;
}

export async function upsertUserFromEntra(profile: EntraProfile) {
  const db = getDb();
  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.entraOid, profile.oid))
    .limit(1);

  if (existing.length > 0) {
    const user = existing[0]!;
    const [updated] = await db
      .update(schema.users)
      .set({
        email: profile.email,
        displayName: profile.displayName,
        role: profile.role,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id))
      .returning();

    if (!updated) {
      throw new Error("Failed to update user from Entra profile");
    }
    return updated;
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      entraOid: profile.oid,
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to insert user from Entra profile");
  }
  return created;
}
