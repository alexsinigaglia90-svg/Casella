"use client";

import { useState } from "react";

import {
  PROJECT_LIST_PREFS_COOKIE,
  DEFAULT_PROJECT_LIST_PREFS,
  type ProjectListPrefs,
} from "./list-prefs-cookie-shared-projects";

export function useProjectListPrefs(initial: ProjectListPrefs = DEFAULT_PROJECT_LIST_PREFS) {
  const [prefs, setPrefsState] = useState<ProjectListPrefs>(initial);

  function setPrefs(next: ProjectListPrefs) {
    setPrefsState(next);
    const maxAge = 60 * 60 * 24 * 365;
    const secure =
      typeof window !== "undefined" && window.location.protocol === "https:"
        ? "; secure"
        : "";
    document.cookie = `${PROJECT_LIST_PREFS_COOKIE}=${encodeURIComponent(JSON.stringify(next))}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
  }

  return { prefs, setPrefs };
}
