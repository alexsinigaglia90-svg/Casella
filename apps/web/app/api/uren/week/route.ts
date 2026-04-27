import { getDb, schema, auditMutation, and, eq, gte, lte } from "@casella/db";
import { getDrivingRoute, MapboxError } from "@casella/maps";
import {
  apiError,
  weekUpsertSchema,
  type HourEntryUpsertInput,
} from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { getCurrentEmployee } from "@/lib/current-employee";
import { getCurrentUser } from "@/lib/current-user";
import {
  getEmployeeWeek,
  getEmployeeProjectsForWeek,
} from "@/lib/hours/queries";

export const dynamic = "force-dynamic";

async function requireEmployee() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: NextResponse.json(
        apiError("unauthenticated", "Niet ingelogd"),
        { status: 401 },
      ),
    } as const;
  }
  const employee = await getCurrentEmployee();
  if (!employee) {
    return {
      error: NextResponse.json(
        apiError("forbidden", "Geen medewerkersprofiel"),
        { status: 403 },
      ),
    } as const;
  }
  return { user, employee } as const;
}

function asIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const auth = await requireEmployee();
  if ("error" in auth) return auth.error;

  const { employee } = auth;

  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart");
  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return NextResponse.json(
      apiError("invalid_params", "weekStart vereist (YYYY-MM-DD)"),
      { status: 400 },
    );
  }

  const [weekData, projects] = await Promise.all([
    getEmployeeWeek(employee.id, weekStart),
    getEmployeeProjectsForWeek(employee.id, weekStart),
  ]);

  return NextResponse.json({ ...weekData, projects });
}

export async function PUT(req: NextRequest) {
  const auth = await requireEmployee();
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      apiError("invalid_json", "Ongeldig JSON-formaat"),
      { status: 400 },
    );
  }

  let input;
  try {
    input = weekUpsertSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        apiError("validation_error", "Ongeldige invoer", err.issues),
        { status: 400 },
      );
    }
    throw err;
  }

  const weekStart = input.weekStart;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndIso = asIso(weekEnd);

  const db = getDb();
  const employee = auth.employee;

  // Fetch employee home address for auto-km computation
  let employeeHomeAddress: { lat: number; lng: number } | null = null;
  if (employee.homeAddressId) {
    const [addr] = await db
      .select({ lat: schema.addresses.lat, lng: schema.addresses.lng })
      .from(schema.addresses)
      .where(eq(schema.addresses.id, employee.homeAddressId!));
    if (addr?.lat != null && addr?.lng != null) {
      employeeHomeAddress = { lat: addr.lat, lng: addr.lng };
    }
  }

  // Build a map of projectId → client address for auto-km
  const projectIds = [...new Set(input.entries.map((e) => e.projectId))];
  const clientAddressByProjectId = new Map<
    string,
    { lat: number; lng: number }
  >();

  if (projectIds.length > 0 && employeeHomeAddress) {
    for (const projectId of projectIds) {
      const [proj] = await db
        .select({
          lat: schema.addresses.lat,
          lng: schema.addresses.lng,
        })
        .from(schema.projects)
        .leftJoin(
          schema.clients,
          eq(schema.projects.clientId, schema.clients.id),
        )
        .leftJoin(
          schema.addresses,
          eq(schema.clients.addressId, schema.addresses.id),
        )
        .where(eq(schema.projects.id, projectId));
      if (proj?.lat != null && proj?.lng != null) {
        clientAddressByProjectId.set(projectId, {
          lat: proj.lat,
          lng: proj.lng,
        });
      }
    }
  }

  // Determine compensationType per project (assignment-override OR employee default)
  const assignmentCompTypeByProjectId = new Map<string, string>();
  if (projectIds.length > 0) {
    const assignments = await db
      .select({
        projectId: schema.projectAssignments.projectId,
        compensationType: schema.projectAssignments.compensationType,
      })
      .from(schema.projectAssignments)
      .where(
        and(
          eq(schema.projectAssignments.employeeId, employee.id),
          // Only get assignments that overlap this week
          // We check both start/end to get the relevant row
        ),
      );
    for (const a of assignments) {
      if (a.compensationType != null) {
        assignmentCompTypeByProjectId.set(a.projectId, a.compensationType);
      }
    }
  }

  // Compute km for each entry
  async function computeKmForEntry(
    entry: HourEntryUpsertInput,
  ): Promise<string | null> {
    const compType =
      assignmentCompTypeByProjectId.get(entry.projectId) ??
      employee.compensationType;
    if (compType !== "auto") return null;
    if (!employeeHomeAddress) return null;
    const clientAddr = clientAddressByProjectId.get(entry.projectId);
    if (!clientAddr) return null;

    try {
      const route = await getDrivingRoute(employeeHomeAddress, clientAddr);
      // Round-trip: home → client → home (×2)
      return String(Math.round(route.distanceKm * 2 * 100) / 100);
    } catch (err) {
      if (err instanceof MapboxError) {
        console.warn(
          `[hours/week] Mapbox auto-km failed for project ${entry.projectId}: ${err.code} — ${err.message}`,
        );
      } else {
        console.warn("[hours/week] Unexpected auto-km error:", err);
      }
      return null;
    }
  }

  await db.transaction(async (tx) => {
    // Delete all draft entries for this employee+week
    await tx
      .delete(schema.hourEntries)
      .where(
        and(
          eq(schema.hourEntries.employeeId, employee.id),
          gte(schema.hourEntries.workDate, weekStart),
          lte(schema.hourEntries.workDate, weekEndIso),
          eq(schema.hourEntries.status, "draft"),
        ),
      );

    // Insert new entries (compute km per entry outside tx to avoid long locks)
    const insertRows = await Promise.all(
      input.entries.map(async (entry) => {
        const kmCached = await computeKmForEntry(entry);
        return {
          employeeId: employee.id,
          projectId: entry.projectId,
          workDate: entry.workDate,
          hours: String(entry.hours),
          kmCached,
          notes: entry.notes ?? null,
          status: "draft" as const,
        };
      }),
    );

    if (insertRows.length > 0) {
      await tx.insert(schema.hourEntries).values(insertRows);
    }

    await auditMutation(tx, {
      actorUserId: auth.user.id,
      action: "hours.upsert_week",
      resourceType: "hour_entries",
      resourceId: employee.id,
      changesJson: { weekStart, entryCount: input.entries.length },
    });
  });

  return NextResponse.json({ ok: true });
}
