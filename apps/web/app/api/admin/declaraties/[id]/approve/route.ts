import { auditMutation, eq, getDb, schema } from "@casella/db";
import { expenseDecidedEmployeeEmail } from "@casella/email";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { EXPENSE_CATEGORY_MAP } from "@/lib/expenses/types";
import { enqueueNotification } from "@/lib/notifications/enqueue";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const approveBodySchema = z.object({
  vatAmountCents: z.number().int().min(0).optional(),
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

  let vatAmountCents: number | undefined;
  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = approveBodySchema.safeParse(rawBody);
    if (parsed.success) {
      vatAmountCents = parsed.data.vatAmountCents;
    }
  } catch {
    // body is optional — continue without vatAmountCents
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
          status: "approved",
          decidedAt: now,
          decidedBy: auth.admin.id,
          vatAmountCents: vatAmountCents ?? null,
          updatedAt: now,
        })
        .where(eq(schema.expenseClaims.id, id));

      await auditMutation(tx, {
        actorUserId: auth.admin.id,
        action: "expense.approved",
        resourceType: "expense_claims",
        resourceId: id,
        changesJson: { previousStatus: existing.status, vatAmountCents },
      });

      claimRow = { ...existing, status: "approved", decidedAt: now, decidedBy: auth.admin.id };
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
    // TODO: Task 18 / Fase 1.7 — push expense as salary component to Nmbrs after approval
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
          type: "expense.approved",
          payload: { claimId: id, category: cr.category },
          emailRender: () =>
            expenseDecidedEmployeeEmail({
              to: emp.email!,
              recipientName: emp.displayName ?? "",
              appUrl: APP_URL,
              ctaPath: "/declaraties",
              decision: "goedgekeurd",
              categoryLabel: categoryConfig?.label ?? cr.category,
            }),
        });
      } catch (e) {
        console.error("expense.approved notify failed", { id, error: e });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
