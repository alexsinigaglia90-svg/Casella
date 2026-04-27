import { auditMutation, eq, getDb, schema } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const configSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  werkgeverslastenPct: z.number().min(0).max(100),
  indirecteKostenPerMaand: z.number().min(0),
  werkbareUrenPerMaand: z.number().int().min(1).max(300),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      apiError("unauthenticated", "Niet ingelogd"),
      { status: 401 },
    );
  }
  if (user.role !== "admin") {
    return NextResponse.json(
      apiError("forbidden", "Geen toegang"),
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      apiError("invalid_json", "Ongeldig JSON-formaat"),
      { status: 400 },
    );
  }

  let input;
  try {
    input = configSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        apiError("validation_error", "Ongeldige invoer", err.issues),
        { status: 400 },
      );
    }
    throw err;
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(schema.bonusConfig)
      .where(eq(schema.bonusConfig.year, input.year))
      .limit(1);
    if (existing[0]) {
      await tx
        .update(schema.bonusConfig)
        .set({
          werkgeverslastenPct: String(input.werkgeverslastenPct),
          indirecteKostenPerMaand: String(input.indirecteKostenPerMaand),
          werkbareUrenPerMaand: input.werkbareUrenPerMaand,
        })
        .where(eq(schema.bonusConfig.year, input.year));
    } else {
      await tx.insert(schema.bonusConfig).values({
        year: input.year,
        werkgeverslastenPct: String(input.werkgeverslastenPct),
        indirecteKostenPerMaand: String(input.indirecteKostenPerMaand),
        werkbareUrenPerMaand: input.werkbareUrenPerMaand,
      });
    }

    await auditMutation(tx, {
      actorUserId: user.id,
      action: "bonus.config.upserted",
      resourceType: "bonus_config",
      resourceId: String(input.year),
      changesJson: {
        werkgeverslastenPct: input.werkgeverslastenPct,
        indirecteKostenPerMaand: input.indirecteKostenPerMaand,
        werkbareUrenPerMaand: input.werkbareUrenPerMaand,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
