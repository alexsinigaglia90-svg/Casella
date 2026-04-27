import "server-only";

import { getDb, schema, eq } from "@casella/db";
import type { AssignmentEnriched } from "@casella/types";
import { cache } from "react";

/**
 * Server-side fetch for a single project-assignment, joined with the
 * project + client + employee names so the edit-drawer / fallback page
 * can render summary text without extra round-trips.
 *
 * Canonical loader for the parallel + intercepting routes:
 *   - `app/(admin)/admin/toewijzingen/[id]/page.tsx` (full-page fallback)
 *   - `app/(admin)/admin/toewijzingen/@modal/(.)[id]/page.tsx` (drawer overlay)
 *
 * Wrapped in `React.cache` so both pages can call it during the same render
 * pass without paying a second DB round-trip. Mirrors the GET-endpoint at
 * `app/api/admin/assignments/[id]/route.ts` (Date columns → ISO strings).
 */
export const getAssignmentById = cache(
  async (id: string): Promise<AssignmentEnriched | null> => {
    const db = getDb();
    const [row] = await db
      .select({
        a: schema.projectAssignments,
        projectName: schema.projects.name,
        clientName: schema.clients.name,
        employeeFirstName: schema.employees.firstName,
        employeeLastName: schema.employees.lastName,
        employeeDisplayName: schema.users.displayName,
      })
      .from(schema.projectAssignments)
      .leftJoin(
        schema.projects,
        eq(schema.projectAssignments.projectId, schema.projects.id),
      )
      .leftJoin(
        schema.clients,
        eq(schema.projects.clientId, schema.clients.id),
      )
      .leftJoin(
        schema.employees,
        eq(schema.projectAssignments.employeeId, schema.employees.id),
      )
      .leftJoin(schema.users, eq(schema.employees.userId, schema.users.id))
      .where(eq(schema.projectAssignments.id, id));

    if (!row) return null;
    const a = row.a;
    const empName =
      [row.employeeFirstName, row.employeeLastName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      row.employeeDisplayName ||
      "Onbekend";

    return {
      id: a.id,
      projectId: a.projectId,
      employeeId: a.employeeId,
      startDate: a.startDate ?? null,
      endDate: a.endDate ?? null,
      kmRateCents: a.kmRateCents,
      compensationType: a.compensationType,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
      projectName: row.projectName ?? "—",
      clientName: row.clientName ?? "—",
      employeeName: empName,
    };
  },
);
