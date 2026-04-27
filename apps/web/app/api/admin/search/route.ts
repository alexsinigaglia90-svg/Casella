import { searchEmployees, type EmployeeSearchResult } from "@casella/db";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, z } from "zod";

import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  q: z.string().min(1).max(100),
  types: z.string().optional().default("employee"),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export async function GET(req: NextRequest) {
  const admin = await getCurrentUser();
  if (!admin)
    return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), {
      status: 401,
    });
  if (admin.role !== "admin")
    return NextResponse.json(apiError("forbidden", "Geen toegang"), {
      status: 403,
    });

  const url = new URL(req.url);
  let parsed: z.infer<typeof QuerySchema>;
  try {
    parsed = QuerySchema.parse({
      q: url.searchParams.get("q"),
      types: url.searchParams.get("types") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
  } catch (err) {
    if (err instanceof ZodError)
      return NextResponse.json(
        apiError("validation_error", "Ongeldige invoer", err.issues),
        { status: 400 },
      );
    throw err;
  }

  const types = parsed.types
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const results: EmployeeSearchResult[] = [];
  if (types.includes("employee")) {
    const empResults = await searchEmployees({
      query: parsed.q,
      limit: parsed.limit,
    });
    results.push(...empResults);
  }
  return NextResponse.json({ results });
}
