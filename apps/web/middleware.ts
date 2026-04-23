import type { NextMiddleware } from "next/server";
import { auth } from "@/auth";

const middleware: NextMiddleware = auth((req) => {
  const { nextUrl, auth: session } = req;
  const isAuthed = !!session;

  const isPublic =
    nextUrl.pathname === "/" ||
    nextUrl.pathname === "/api/auth" ||
    nextUrl.pathname.startsWith("/api/auth/") ||
    nextUrl.pathname === "/onboarding-pending";

  if (!isAuthed && !isPublic) {
    return Response.redirect(new URL("/", nextUrl));
  }
}) as unknown as NextMiddleware;

export default middleware;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
