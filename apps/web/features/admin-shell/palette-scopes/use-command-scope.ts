"use client";

import { useCallback, useState } from "react";
import type { KeyboardEvent } from "react";

export type CommandScope = "commands" | "employees" | "projects" | "help" | null;

const PREFIX_MAP: Record<string, NonNullable<CommandScope>> = {
  ">": "commands",
  "@": "employees",
  "#": "projects",
  "?": "help",
};

interface UseCommandScopeReturn {
  scope: CommandScope;
  setScope: (s: CommandScope) => void;
  query: string;
  setQuery: (v: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  reset: () => void;
}

export function useCommandScope(): UseCommandScopeReturn {
  const [scope, setScope] = useState<CommandScope>(null);
  const [query, setQueryState] = useState("");

  const setQuery = useCallback(
    (value: string) => {
      if (scope === null && value.length === 1 && value in PREFIX_MAP) {
        setScope(PREFIX_MAP[value] ?? null);
        setQueryState("");
        return;
      }
      setQueryState(value);
    },
    [scope],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && scope !== null && query === "") {
        e.preventDefault();
        setScope(null);
      }
    },
    [scope, query],
  );

  const reset = useCallback(() => {
    setScope(null);
    setQueryState("");
  }, []);

  return { scope, setScope, query, setQuery, onKeyDown, reset };
}
