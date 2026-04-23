"use client";

import { useEffect, useState } from "react";
import { THEME_COOKIE, type ThemePreference } from "./theme-cookie-shared";

function readCookie(): ThemePreference {
  const match = document.cookie.match(
    new RegExp(`${THEME_COOKIE.replace(/\./g, "\\.")}=(light|dark|system)`)
  );
  return (match?.[1] as ThemePreference) ?? "system";
}

function applyTheme(pref: ThemePreference) {
  const resolved =
    pref === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : pref;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.setAttribute("data-theme", resolved);
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(() =>
    typeof document === "undefined" ? "system" : readCookie()
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (readCookie() === "system") applyTheme("system");
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const setTheme = (next: ThemePreference) => {
    const maxAge = 60 * 60 * 24 * 365;
    const secure =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "; secure"
        : "";
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
    applyTheme(next);
    setThemeState(next);
    // Fire-and-forget server persist; failure is non-fatal (cookie + DOM already updated).
    fetch("/api/user/theme", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ theme: next }),
    }).catch(() => {});
  };

  return { theme, setTheme };
}
