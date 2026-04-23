import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema, eq } from "@casella/db";
import { z } from "zod";

const bodySchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
});

export async function POST(req: Request) {
  const session = await auth();
  const entraOid = session?.entraOid;
  if (!entraOid) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const db = getDb();
  await db
    .update(schema.users)
    .set({ themePreference: parsed.data.theme, updatedAt: new Date() })
    .where(eq(schema.users.entraOid, entraOid));

  return NextResponse.json({ ok: true });
}
