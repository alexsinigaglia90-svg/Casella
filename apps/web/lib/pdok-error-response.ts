import { NextResponse } from "next/server";
import { PdokError } from "@casella/maps";
import { apiError } from "@casella/types";

export function pdokErrorResponse(err: unknown): NextResponse {
  if (err instanceof PdokError) {
    switch (err.code) {
      case "timeout":
        return NextResponse.json(
          apiError("pdok_timeout", "Adresservice reageert niet, probeer opnieuw"),
          { status: 504 }
        );
      case "no_results":
        return NextResponse.json(
          apiError("pdok_not_found", "Adres niet gevonden"),
          { status: 404 }
        );
      case "http":
      case "schema":
        return NextResponse.json(
          apiError("pdok_unavailable", "Adresservice tijdelijk niet beschikbaar"),
          { status: 502 }
        );
      default: {
        const _exhaustive: never = err.code;
        void _exhaustive;
        return NextResponse.json(
          apiError("internal_error", "Er ging iets mis aan onze kant"),
          { status: 500 }
        );
      }
    }
  }
  return NextResponse.json(
    apiError("internal_error", "Er ging iets mis aan onze kant"),
    { status: 500 }
  );
}
