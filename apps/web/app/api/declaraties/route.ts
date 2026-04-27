import { auditMutation, eq, getDb, schema } from "@casella/db";
import { expenseSubmittedAdminEmail } from "@casella/email";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { EXPENSE_CATEGORY_MAP } from "@/lib/expenses/types";
import { expenseSubmitSchema } from "@/lib/expenses/validation";
import { getCurrentEmployee } from "@/lib/current-employee";
import { getCurrentUser } from "@/lib/current-user";
import { enqueueNotification } from "@/lib/notifications/enqueue";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
    input = expenseSubmitSchema.parse(body);
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
  let claimId = "";
  await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(schema.expenseClaims)
      .values({
        employeeId: employee.id,
        category: input.category,
        projectId: input.projectId ?? null,
        isInternal: input.isInternal,
        amountCents: input.amountCents,
        date: input.date,
        description: input.description,
        receiptStoragePath: input.receiptStoragePath,
        categoryPayload: input.categoryPayload ?? null,
        status: "submitted",
        submittedAt: new Date(),
      })
      .returning({ id: schema.expenseClaims.id });
    claimId = inserted[0]?.id ?? "";

    await auditMutation(tx, {
      actorUserId: user.id,
      action: "expense.submitted",
      resourceType: "expense_claims",
      resourceId: claimId,
      changesJson: {
        category: input.category,
        amountCents: input.amountCents,
        date: input.date,
      },
    });
  });

  const admins = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      displayName: schema.users.displayName,
    })
    .from(schema.users)
    .where(eq(schema.users.role, "admin"));

  const employeeName = employee.firstName
    ? `${employee.firstName} ${employee.lastName ?? ""}`.trim()
    : "Een medewerker";
  const categoryConfig = EXPENSE_CATEGORY_MAP[input.category];
  const amountEur = `€ ${(input.amountCents / 100).toFixed(2).replace(".", ",")}`;

  for (const admin of admins) {
    try {
      await enqueueNotification({
        userId: admin.id,
        type: "expense.submitted",
        payload: {
          claimId,
          employeeId: employee.id,
          category: input.category,
          amountCents: input.amountCents,
        },
        emailRender: () =>
          expenseSubmittedAdminEmail({
            to: admin.email,
            recipientName: admin.displayName,
            appUrl: APP_URL,
            ctaPath: "/admin/declaraties",
            employeeName,
            categoryLabel: categoryConfig?.label ?? input.category,
            amountEur,
          }),
      });
    } catch (e) {
      console.error("expense.submitted notify failed", { adminId: admin.id, error: e });
    }
  }

  return NextResponse.json({ id: claimId });
}
