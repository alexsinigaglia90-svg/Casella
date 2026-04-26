import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { lookupAddress } from "@casella/maps";
import { pdokErrorResponse } from "@/lib/pdok-error-response";
import { apiError } from "@casella/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), { status: 401 });
  }

  const { id } = await params;
  if (!id || id.length > 200) {
    return NextResponse.json(apiError("pdok_invalid_query", "Ongeldig adres-ID"), { status: 400 });
  }

  try {
    const address = await lookupAddress(id);
    const response = NextResponse.json({ address });
    response.headers.set("Cache-Control", "private, max-age=86400");
    return response;
  } catch (err) {
    return pdokErrorResponse(err);
  }
}
