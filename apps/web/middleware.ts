import { NextResponse, type NextMiddleware } from "next/server";

import { auth } from "@/auth";
import { THEME_COOKIE } from "@/lib/theme-cookie-shared";

// Cookie options — mirror THEME_COOKIE_OPTS used by the client toggle.
const THEME_COOKIE_OPTS = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
} as const;

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

  // ML-5: Bootstrap theme cookie from DB preference stored in session token.
  // Only writes cookie when session carries a non-system preference AND the
  // cookie isn't already set (avoids overwriting live toggle state).
  const themePref = session?.themePreference;
  const hasCookie = req.cookies.has(THEME_COOKIE);
  if (themePref && themePref !== "system" && !hasCookie) {
    const res = NextResponse.next();
    res.cookies.set(THEME_COOKIE, themePref, THEME_COOKIE_OPTS);
    return res;
  }
}) as unknown as NextMiddleware;

export default middleware;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
