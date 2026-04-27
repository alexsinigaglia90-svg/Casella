import { auditMutation, eq, getDb, schema } from "@casella/db";
import { expenseDecidedEmployeeEmail } from "@casella/email";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { EXPENSE_CATEGORY_MAP } from "@/lib/expenses/types";
import { rejectExpenseSchema } from "@/lib/expenses/validation";
import { getCurrentUser } from "@/lib/current-user";
import { enqueueNotification } from "@/lib/notifications/enqueue";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      apiError("invalid_params", "id vereist"),
      { status: 400 },
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
    input = rejectExpenseSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        apiError("validation_error", "Reden is verplicht", err.issues),
        { status: 400 },
      );
    }
    throw err;
  }

  const db = getDb();
  const now = new Date();

  let claimRow: typeof schema.expenseClaims.$inferSelect | null = null;

  try {
    await db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(schema.expenseClaims)
        .where(eq(schema.expenseClaims.id, id))
        .limit(1);
      const existing = rows[0];
      if (!existing) {
        throw new Error("not_found");
      }
      if (existing.status !== "submitted") {
        throw new Error("invalid_state");
      }

      await tx
        .update(schema.expenseClaims)
        .set({
          status: "rejected",
          decidedAt: now,
          decidedBy: auth.admin.id,
          rejectionReason: input.reason,
          updatedAt: now,
        })
        .where(eq(schema.expenseClaims.id, id));

      await auditMutation(tx, {
        actorUserId: auth.admin.id,
        action: "expense.rejected",
        resourceType: "expense_claims",
        resourceId: id,
        changesJson: { previousStatus: existing.status, reason: input.reason },
      });

      claimRow = { ...existing, status: "rejected", decidedAt: now, decidedBy: auth.admin.id, rejectionReason: input.reason };
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "not_found") {
      return NextResponse.json(
        apiError("not_found", "Declaratie niet gevonden"),
        { status: 404 },
      );
    }
    if (msg === "invalid_state") {
      return NextResponse.json(
        apiError("invalid_state", "Declaratie is niet 'submitted'"),
        { status: 409 },
      );
    }
    throw e;
  }

  if (claimRow) {
    const cr = claimRow as typeof schema.expenseClaims.$inferSelect;
    const empRows = await db
      .select({
        employeeId: schema.employees.id,
        firstName: schema.employees.firstName,
        lastName: schema.employees.lastName,
        userId: schema.employees.userId,
        email: schema.users.email,
        displayName: schema.users.displayName,
      })
      .from(schema.employees)
      .leftJoin(schema.users, eq(schema.users.id, schema.employees.userId))
      .where(eq(schema.employees.id, cr.employeeId))
      .limit(1);
    const emp = empRows[0];
    if (emp?.userId && emp.email) {
      const categoryConfig = EXPENSE_CATEGORY_MAP[cr.category as keyof typeof EXPENSE_CATEGORY_MAP];
      try {
        await enqueueNotification({
          userId: emp.userId,
          employeeId: emp.employeeId,
          type: "expense.rejected",
          payload: { claimId: id, category: cr.category, reason: input.reason },
          emailRender: () =>
            expenseDecidedEmployeeEmail({
              to: emp.email!,
              recipientName: emp.displayName ?? "",
              appUrl: APP_URL,
              ctaPath: "/declaraties",
              decision: "afgewezen",
              categoryLabel: categoryConfig?.label ?? cr.category,
              reason: input.reason,
            }),
        });
      } catch (e) {
        console.error("expense.rejected notify failed", { id, error: e });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
