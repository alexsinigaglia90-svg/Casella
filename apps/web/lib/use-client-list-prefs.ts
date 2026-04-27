"use client";

import { useState } from "react";

import {
  CLIENT_LIST_PREFS_COOKIE,
  DEFAULT_CLIENT_LIST_PREFS,
  type ClientListPrefs,
} from "./client-list-prefs-shared";

export function useClientListPrefs(initial: ClientListPrefs = DEFAULT_CLIENT_LIST_PREFS) {
  const [prefs, setPrefsState] = useState<ClientListPrefs>(initial);

  function setPrefs(next: ClientListPrefs) {
    setPrefsState(next);
    const maxAge = 60 * 60 * 24 * 365;
    const secure =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "; secure"
        : "";
    document.cookie = `${CLIENT_LIST_PREFS_COOKIE}=${encodeURIComponent(JSON.stringify(next))}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
  }

  return { prefs, setPrefs };
}
