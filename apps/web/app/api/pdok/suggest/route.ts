import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { suggestAddresses } from "@casella/maps";
import { pdokErrorResponse } from "@/lib/pdok-error-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const raw = req.nextUrl.searchParams.get("q") ?? "";
  const q = raw.trim().slice(0, 100);

  if (q.length === 0) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  try {
    const results = await suggestAddresses(q, 8);
    const response = NextResponse.json({ results });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (err) {
    return pdokErrorResponse(err);
  }
}
