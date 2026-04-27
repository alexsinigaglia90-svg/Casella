import { auditMutation, eq, getDb, schema } from "@casella/db";
import { contractUploadedEmployeeEmail } from "@casella/email";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { enqueueNotification } from "@/lib/notifications/enqueue";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const contractUploadSchema = z.object({
  employeeId: z.string().uuid(),
  startDate: z.string().date(),
  endDate: z.string().date().optional().nullable(),
  jobTitle: z.string().min(1).max(200),
  pdfStoragePath: z.string().min(1),
  brutoSalarisMaandCents: z.number().int().min(0).optional().nullable(),
  vakantietoeslagPct: z.number().min(0).max(100).optional().nullable(),
  baselineTariefPerUur: z.number().min(0).optional().nullable(),
  bonusPctBelowBaseline: z.number().min(0).max(100).optional().nullable(),
  bonusPctAboveBaseline: z.number().min(0).max(100).optional().nullable(),
  maxOverperformancePct: z.number().min(0).max(100).optional().nullable(),
  autoStelpostActief: z.boolean().optional(),
  autoStelpostBedragMaand: z.number().min(0).optional().nullable(),
});

async function requireAdmin() {
  const u = await getCurrentUser();
  if (!u) {
    return {
      error: NextResponse.json(
        apiError("unauthenticated", "Niet ingelogd"),
        { status: 401 },
      ),
    } as const;
  }
  if (u.role !== "admin") {
    return {
      error: NextResponse.json(
        apiError("forbidden", "Geen toegang"),
        { status: 403 },
      ),
    } as const;
  }
  return { admin: u } as const;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
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
    input = contractUploadSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        apiError("validation_error", "Ongeldige invoer", err.issues),
        { status: 400 },
      );
    }
    throw err;
  }

  const db = getDb();

  // Verify employee exists
  const empRows = await db
    .select({
      id: schema.employees.id,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
      userId: schema.employees.userId,
      email: schema.users.email,
      displayName: schema.users.displayName,
    })
    .from(schema.employees)
    .leftJoin(schema.users, eq(schema.employees.userId, schema.users.id))
    .where(eq(schema.employees.id, input.employeeId))
    .limit(1);
  const emp = empRows[0];
  if (!emp) {
    return NextResponse.json(
      apiError("not_found", "Medewerker niet gevonden"),
      { status: 404 },
    );
  }

  let contractId = "";
  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(schema.contracts)
      .values({
        employeeId: input.employeeId,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        jobTitle: input.jobTitle,
        pdfStoragePath: input.pdfStoragePath,
        brutoSalarisMaandCents: input.brutoSalarisMaandCents != null
          ? String(input.brutoSalarisMaandCents)
          : null,
        vakantietoeslagPct: input.vakantietoeslagPct != null
          ? String(input.vakantietoeslagPct)
          : undefined,
        baselineTariefPerUur: input.baselineTariefPerUur != null
          ? String(input.baselineTariefPerUur)
          : undefined,
        bonusPctBelowBaseline: input.bonusPctBelowBaseline != null
          ? String(input.bonusPctBelowBaseline)
          : undefined,
        bonusPctAboveBaseline: input.bonusPctAboveBaseline != null
          ? String(input.bonusPctAboveBaseline)
          : undefined,
        maxOverperformancePct: input.maxOverperformancePct != null
          ? String(input.maxOverperformancePct)
          : undefined,
        autoStelpostActief: input.autoStelpostActief ?? false,
        autoStelpostBedragMaand: input.autoStelpostBedragMaand != null
          ? String(input.autoStelpostBedragMaand)
          : undefined,
        uploadedBy: auth.admin.id,
        uploadedAt: new Date(),
      })
      .returning({ id: schema.contracts.id });
    contractId = inserted[0]?.id ?? "";

    await auditMutation(tx, {
      actorUserId: auth.admin.id,
      action: "contract.uploaded",
      resourceType: "contracts",
      resourceId: contractId,
      changesJson: {
        employeeId: input.employeeId,
        jobTitle: input.jobTitle,
        startDate: input.startDate,
      },
    });
  });

  if (emp.userId && emp.email) {
    try {
      await enqueueNotification({
        userId: emp.userId,
        employeeId: emp.id,
        type: "contract.uploaded",
        payload: { contractId, employeeId: input.employeeId },
        emailRender: () =>
          contractUploadedEmployeeEmail({
            to: emp.email!,
            recipientName: emp.displayName ?? emp.firstName ?? "Medewerker",
            appUrl: APP_URL,
            ctaPath: "/contract",
          }),
      });
    } catch (e) {
      console.error("contract.uploaded notify failed", { contractId, error: e });
    }
  }

  return NextResponse.json({ id: contractId });
}
