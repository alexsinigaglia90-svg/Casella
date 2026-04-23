import { cookies } from "next/headers";

export const THEME_COOKIE = "casella.theme";
export type ThemePreference = "light" | "dark" | "system";

export async function getThemePreference(): Promise<ThemePreference> {
  const store = await cookies();
  const v = store.get(THEME_COOKIE)?.value;
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

export async function setThemePreference(t: ThemePreference) {
  const store = await cookies();
  store.set(THEME_COOKIE, t, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
}
