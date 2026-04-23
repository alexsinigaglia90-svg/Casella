import { cache } from "react";
import { eq, getDb, schema } from "@casella/db";
import { getCurrentUser } from "./current-user";

export const getCurrentEmployee = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.employees)
    .where(eq(schema.employees.userId, user.id))
    .limit(1);
  return rows[0] ?? null;
});
