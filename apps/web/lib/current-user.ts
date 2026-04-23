import { auth } from "@/auth";
import { eq, getDb, schema } from "@casella/db";
import type { Role } from "@casella/types";
import { cache } from "react";

export interface CurrentUser {
  id: string;
  entraOid: string;
  email: string;
  displayName: string;
  role: Role;
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const entraOid = session?.entraOid;
  if (!entraOid) return null;

  const db = getDb();
  const rows = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.entraOid, entraOid))
    .limit(1);

  const user = rows[0];
  if (!user) return null;

  return {
    id: user.id,
    entraOid: user.entraOid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
});
