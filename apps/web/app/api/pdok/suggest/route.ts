import { suggestAddresses } from "@casella/maps";
import { apiError } from "@casella/types";
import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { pdokErrorResponse } from "@/lib/pdok-error-response";


export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), { status: 401 });
  }

  const raw = req.nextUrl.searchParams.get("q") ?? "";
  if (raw.length > 100) {
    return NextResponse.json(apiError("pdok_invalid_query", "Zoekopdracht is te lang"), { status: 400 });
  }
  const q = raw.trim();

  try {
    const results = await suggestAddresses(q, 8);
    const response = NextResponse.json({ results });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (err) {
    return pdokErrorResponse(err);
  }
}
