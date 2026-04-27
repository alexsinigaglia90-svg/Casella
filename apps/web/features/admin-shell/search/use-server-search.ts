"use client";

import { useEffect, useState } from "react";

export interface ServerSearchResult {
  entityType: "employee";
  entityId: string;
  title: string;
  subtitle: string;
  score: number;
}

interface UseServerSearchReturn {
  results: ServerSearchResult[];
  loading: boolean;
}

export function useServerSearch(
  query: string,
  enabled: boolean,
): UseServerSearchReturn {
  const [results, setResults] = useState<ServerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || query.trim().length === 0) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/search?q=${encodeURIComponent(query)}`,
        );
        if (cancelled) return;
        if (!res.ok) {
          setResults([]);
          return;
        }
        const json = (await res.json()) as { results: ServerSearchResult[] };
        if (!cancelled) setResults(json.results ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, enabled]);

  return { results, loading };
}
