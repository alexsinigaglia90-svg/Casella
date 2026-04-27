"use client";

import { useState } from "react";

import {
  ASSIGNMENTS_LIST_PREFS_COOKIE,
  DEFAULT_ASSIGNMENTS_LIST_PREFS,
  type AssignmentsListPrefs,
} from "./list-prefs-cookie-shared-assignments";

export function useAssignmentsListPrefs(
  initial: AssignmentsListPrefs = DEFAULT_ASSIGNMENTS_LIST_PREFS,
) {
  const [prefs, setPrefsState] = useState<AssignmentsListPrefs>(initial);

  function setPrefs(next: AssignmentsListPrefs) {
    setPrefsState(next);
    const maxAge = 60 * 60 * 24 * 365;
    const secure =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "; secure"
        : "";
    document.cookie = `${ASSIGNMENTS_LIST_PREFS_COOKIE}=${encodeURIComponent(
      JSON.stringify(next),
    )}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
  }

  return { prefs, setPrefs };
}
