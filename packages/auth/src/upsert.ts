import { eq, and, isNull, sql } from "drizzle-orm";
import { getDb, schema, auditMutation } from "@casella/db";
import type { Role } from "@casella/types";

export interface EntraProfile {
  oid: string;
  email: string;
  displayName: string;
  role: Role;
}

export async function upsertUserFromEntra(profile: EntraProfile) {
  const db = getDb();

  return db.transaction(async (tx) => {
    // 1. Upsert users row
    const existing = await tx
      .select()
      .from(schema.users)
      .where(eq(schema.users.entraOid, profile.oid))
      .limit(1);

    let user: typeof existing[number];
    if (existing.length > 0) {
      const [updated] = await tx
        .update(schema.users)
        .set({
          email: profile.email,
          displayName: profile.displayName,
          role: profile.role,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, existing[0]!.id))
        .returning();
      if (!updated) throw new Error("Failed to update user from Entra profile");
      user = updated;
    } else {
      const [created] = await tx
        .insert(schema.users)
        .values({
          entraOid: profile.oid,
          email: profile.email,
          displayName: profile.displayName,
          role: profile.role,
        })
        .returning();
      if (!created) throw new Error("Failed to insert user from Entra profile");
      user = created;
    }

    // 2. If there's a matching invite, bind employees.user_id
    const invite = await tx
      .select()
      .from(schema.employees)
      .where(
        and(
          isNull(schema.employees.userId),
          sql`LOWER(${schema.employees.inviteEmail}) = LOWER(${profile.email})`
        )
      )
      .limit(1);

    if (invite.length > 0) {
      await tx
        .update(schema.employees)
        .set({
          userId: user.id,
          inviteEmail: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.employees.id, invite[0]!.id));

      await auditMutation(tx, {
        actorUserId: user.id,
        action: "employees.invite_bound",
        resourceType: "employees",
        resourceId: invite[0]!.id,
        changesJson: { boundTo: user.id, viaEmail: profile.email },
      });
    }

    return user;
  });
}
