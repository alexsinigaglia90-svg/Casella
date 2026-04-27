"use server";

import { auditMutation, eq, getDb, schema } from "@casella/db";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/current-user";

/**
 * Server-action wrapper for the timeline drag/resize flow. Updates only
 * `startDate` and `endDate` on a single assignment, with the same audit-log
 * pattern as the PATCH route. Returns a discriminated union so the client
 * can revert the optimistic position on failure.
 */
export async function updateAssignmentRange(
  id: string,
  startDate: string | null,
  endDate: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Niet ingelogd" };
  if (user.role !== "admin") return { ok: false, error: "Geen toegang" };

  if (!id || typeof id !== "string") {
    return { ok: false, error: "Ongeldig toewijzings-ID" };
  }

  // Basic ISO-date validation: allow null or "YYYY-MM-DD".
  const isIso = (v: string | null): boolean =>
    v === null || /^\d{4}-\d{2}-\d{2}$/.test(v);
  if (!isIso(startDate) || !isIso(endDate)) {
    return { ok: false, error: "Ongeldige datum" };
  }
  if (startDate && endDate && startDate > endDate) {
    return { ok: false, error: "Startdatum na einddatum" };
  }

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [before] = await tx
      .select()
      .from(schema.projectAssignments)
      .where(eq(schema.projectAssignments.id, id));
    if (!before) return { kind: "not-found" } as const;

    const patch = {
      startDate,
      endDate,
      updatedAt: new Date(),
    };

    await tx
      .update(schema.projectAssignments)
      .set(patch)
      .where(eq(schema.projectAssignments.id, id));

    await auditMutation(tx, {
      actorUserId: user.id,
      action: "assignments.update_range",
      resourceType: "project_assignments",
      resourceId: id,
      changesJson: {
        before: { startDate: before.startDate, endDate: before.endDate },
        patch: { startDate, endDate },
      },
    });

    return { kind: "ok" } as const;
  });

  if (result.kind === "not-found") {
    return { ok: false, error: "Toewijzing niet gevonden" };
  }

  revalidatePath("/admin/toewijzingen");
  return { ok: true };
}
