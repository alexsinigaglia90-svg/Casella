import { getDb, schema, eq } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";

const bodySchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
});

export async function POST(req: Request) {
  const session = await auth();
  const entraOid = session?.entraOid;
  if (!entraOid) {
    return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(apiError("invalid_theme_value", "Ongeldige theme-waarde"), { status: 400 });
  }

  const db = getDb();
  await db
    .update(schema.users)
    .set({ themePreference: parsed.data.theme, updatedAt: new Date() })
    .where(eq(schema.users.entraOid, entraOid));

  return NextResponse.json({ ok: true });
}
