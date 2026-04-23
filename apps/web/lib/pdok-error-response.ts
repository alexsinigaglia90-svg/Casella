import { NextResponse } from "next/server";
import { PdokError } from "@casella/maps";

export function pdokErrorResponse(err: unknown): NextResponse {
  if (err instanceof PdokError) {
    switch (err.code) {
      case "timeout":
        return NextResponse.json(
          { error: "Address service timed out" },
          { status: 504 }
        );
      case "no_results":
        return NextResponse.json(
          { error: "Address not found" },
          { status: 404 }
        );
      case "http":
      case "schema":
        return NextResponse.json(
          { error: "Address service unavailable" },
          { status: 502 }
        );
    }
  }
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
