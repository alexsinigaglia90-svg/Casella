import { sql } from "drizzle-orm";

import { getDb } from "../client";

export interface EmployeeSearchResult {
  entityType: "employee";
  entityId: string;
  title: string;
  subtitle: string;
  score: number;
}

type RawSearchRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  score: number;
} & Record<string, unknown>;

export async function searchEmployees({
  query,
  limit = 10,
}: {
  query: string;
  limit?: number;
}): Promise<EmployeeSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const db = getDb();
  const useTrigram = trimmed.length < 3;

  const result = useTrigram
    ? await db.execute<RawSearchRow>(sql`
        SELECT id, first_name, last_name, job_title,
               similarity(coalesce(first_name,'') || ' ' || coalesce(last_name,''), ${trimmed}) AS score
        FROM employees
        WHERE coalesce(first_name,'') || ' ' || coalesce(last_name,'') % ${trimmed}
        ORDER BY score DESC
        LIMIT ${limit}
      `)
    : await db.execute<RawSearchRow>(sql`
        SELECT id, first_name, last_name, job_title,
               ts_rank(search_vector, websearch_to_tsquery('dutch', ${trimmed})) AS score
        FROM employees
        WHERE search_vector @@ websearch_to_tsquery('dutch', ${trimmed})
        ORDER BY score DESC
        LIMIT ${limit}
      `);

  // postgres-js's db.execute returns a RowList (array-like) of rows directly.
  const rows = result as unknown as RawSearchRow[];

  return rows.map((r) => {
    const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || "Medewerker";
    return {
      entityType: "employee" as const,
      entityId: r.id,
      title: name,
      subtitle: r.job_title ?? "",
      score: Number(r.score),
    };
  });
}
