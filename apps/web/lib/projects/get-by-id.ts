import "server-only";

import { getDb, schema, eq } from "@casella/db";
import type { ProjectWithClient } from "@casella/types";
import { cache } from "react";

/**
 * Server-side fetch for a single project with joined client name.
 *
 * Canonical loader for the parallel + intercepting routes:
 *  - `app/(admin)/admin/projecten/[id]/page.tsx` (full-page fallback)
 *  - `app/(admin)/admin/projecten/@modal/(.)[id]/page.tsx` (drawer overlay)
 *
 * Wrapped in `React.cache` so both pages can call it during the same render
 * pass without paying a second DB round-trip. Mirrors the GET-endpoint at
 * `app/api/admin/projects/[id]/route.ts` (Date columns → ISO strings).
 */
export const getProjectById = cache(
  async (id: string): Promise<ProjectWithClient | null> => {
    const db = getDb();
    const [row] = await db
      .select({
        project: schema.projects,
        clientName: schema.clients.name,
      })
      .from(schema.projects)
      .leftJoin(schema.clients, eq(schema.projects.clientId, schema.clients.id))
      .where(eq(schema.projects.id, id));
    if (!row) return null;
    const p = row.project;
    return {
      id: p.id,
      clientId: p.clientId,
      name: p.name,
      description: p.description,
      startDate: p.startDate ?? null,
      endDate: p.endDate ?? null,
      status: p.status,
      createdBy: p.createdBy,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      clientName: row.clientName ?? "—",
    };
  },
);
