"use client";

import { useState } from "react";

import { LIST_PREFS_COOKIE, DEFAULT_LIST_PREFS, type ListPrefs } from "./list-prefs-cookie-shared";

export function useListPrefs(initial: ListPrefs = DEFAULT_LIST_PREFS) {
  const [prefs, setPrefsState] = useState<ListPrefs>(initial);

  function setPrefs(next: ListPrefs) {
    setPrefsState(next);
    const maxAge = 60 * 60 * 24 * 365;
    const secure =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "; secure"
        : "";
    document.cookie = `${LIST_PREFS_COOKIE}=${encodeURIComponent(JSON.stringify(next))}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
  }

  return { prefs, setPrefs };
}
