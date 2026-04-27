import { auditMutation, desc, eq, getDb, schema } from "@casella/db";
import { statementReadyEmployeeEmail } from "@casella/email";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError } from "zod";

import { generateStatementPdf } from "@/lib/statements/pdf-generator";
import { getCurrentEmployee } from "@/lib/current-employee";
import { getCurrentUser } from "@/lib/current-user";
import { enqueueNotification } from "@/lib/notifications/enqueue";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Stub employer + signature constants (Fase 2: real config from env / admin settings).
// See deferred-work entries STATEMENTS-EMPLOYER-CONFIG + STATEMENTS-ADMIN-SIGNATURE-CONFIG.
const EMPLOYER = {
  name: "Ascentra Nederland B.V.",
  kvk: "87654321",
  address: "Lange Voorhout 1, 2514 EA Den Haag",
};
const SIGNATURE_DEFAULTS = {
  signedBy: "Alex Sinigaglia",
  locationCity: "Den Haag",
};

const submitSchema = z.object({
  purpose: z.enum(["mortgage", "rent", "other"]),
  nhgIndicator: z.boolean().optional(),
  lenderName: z.string().optional(),
  loanAmountIndicativeCents: z.number().int().optional(),
  landlordName: z.string().optional(),
  landlordAddress: z.string().optional(),
  monthlyRentCents: z.number().int().optional(),
  purposeOtherReason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      apiError("unauthenticated", "Niet ingelogd"),
      { status: 401 },
    );
  }
  const employee = await getCurrentEmployee();
  if (!employee) {
    return NextResponse.json(
      apiError("forbidden", "Geen medewerkersprofiel"),
      { status: 403 },
    );
  }

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
    input = submitSchema.parse(body);
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

  // Active contract for salary + jobTitle + startDate.
  const contractRows = await db
    .select()
    .from(schema.contracts)
    .where(eq(schema.contracts.employeeId, employee.id))
    .orderBy(desc(schema.contracts.startDate))
    .limit(1);
  const contract = contractRows[0];

  // User row for displayName.
  const userRows = await db
    .select({ email: schema.users.email, displayName: schema.users.displayName })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .limit(1);
  const userRow = userRows[0];

  const fullName =
    userRow?.displayName ??
    (employee.firstName
      ? `${employee.firstName} ${employee.lastName ?? ""}`.trim()
      : "Werknemer");

  const brutoSalarisMaandCents = contract?.brutoSalarisMaandCents
    ? Math.round(parseFloat(contract.brutoSalarisMaandCents))
    : null;

  const now = new Date();
  const todayIso = `${now.getUTCFullYear()}-${(now.getUTCMonth() + 1)
    .toString()
    .padStart(2, "0")}-${now.getUTCDate().toString().padStart(2, "0")}`;

  const pdfBuffer = await generateStatementPdf({
    purpose: input.purpose,
    employee: {
      fullName,
      jobTitle: contract?.jobTitle ?? employee.jobTitle ?? "—",
      startDate: contract?.startDate ?? employee.startDate ?? todayIso,
      endDate: contract?.endDate ?? null,
      brutoSalarisMaandCents,
      vakantietoeslagPct: contract?.vakantietoeslagPct ?? null,
    },
    employer: EMPLOYER,
    signature: {
      signedBy: SIGNATURE_DEFAULTS.signedBy,
      signedAt: todayIso,
      locationCity: SIGNATURE_DEFAULTS.locationCity,
    },
    purposeData: {
      nhgIndicator: input.nhgIndicator,
      lenderName: input.lenderName,
      loanAmountIndicativeCents: input.loanAmountIndicativeCents,
      landlordName: input.landlordName,
      landlordAddress: input.landlordAddress,
      monthlyRentCents: input.monthlyRentCents,
      purposeOtherReason: input.purposeOtherReason,
    },
  });

  // STATEMENTS-STORAGE-MIGRATION: storing base64 in generatedPdfPath as a stub
  // until Supabase Storage lands in Fase 2.
  const base64 = pdfBuffer.toString("base64");

  let statementId = "";
  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(schema.employerStatements)
      .values({
        employeeId: employee.id,
        purpose: input.purpose,
        nhgIndicator: input.nhgIndicator ?? null,
        lenderName: input.lenderName ?? null,
        loanAmountIndicativeCents: input.loanAmountIndicativeCents ?? null,
        landlordName: input.landlordName ?? null,
        landlordAddress: input.landlordAddress ?? null,
        monthlyRentCents: input.monthlyRentCents ?? null,
        purposeOtherReason: input.purposeOtherReason ?? null,
        generatedPdfPath: base64,
        status: "delivered",
        requestedAt: now,
        generatedAt: now,
        deliveredAt: now,
      })
      .returning({ id: schema.employerStatements.id });
    statementId = inserted[0]?.id ?? "";

    await auditMutation(tx, {
      actorUserId: user.id,
      action: "statement.generated",
      resourceType: "employer_statements",
      resourceId: statementId,
      changesJson: { purpose: input.purpose },
    });
  });

  if (userRow?.email) {
    try {
      await enqueueNotification({
        userId: user.id,
        employeeId: employee.id,
        type: "statement.ready",
        payload: { statementId, purpose: input.purpose },
        emailRender: () =>
          statementReadyEmployeeEmail({
            to: userRow.email,
            recipientName: userRow.displayName ?? fullName,
            appUrl: APP_URL,
            ctaPath: "/werkgeversverklaring",
          }),
      });
    } catch (e) {
      console.error("statement.ready notify failed", { statementId, error: e });
    }
  }

  return NextResponse.json({
    id: statementId,
    downloadUrl: `/api/werkgeversverklaring/${statementId}/download`,
  });
}
