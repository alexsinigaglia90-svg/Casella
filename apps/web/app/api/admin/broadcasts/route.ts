import { eq, getDb, schema } from "@casella/db";
import { broadcastEmployeeEmail } from "@casella/email";
import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { enqueueNotification } from "@/lib/notifications/enqueue";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  targetEmployeeIds: z.array(z.string()).nullable().default(null),
});

async function requireAdmin() {
  const u = await getCurrentUser();
  if (!u) {
    return {
      error: NextResponse.json(apiError("unauthenticated", "Niet ingelogd"), { status: 401 }),
    } as const;
  }
  if (u.role !== "admin") {
    return {
      error: NextResponse.json(apiError("forbidden", "Geen toegang"), { status: 403 }),
    } as const;
  }
  return { admin: u } as const;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        apiError("invalid_params", parsed.error.issues[0]?.message ?? "Ongeldige invoer"),
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json(apiError("invalid_params", "Ongeldige JSON"), { status: 400 });
  }

  const db = getDb();

  // Insert broadcast row
  const [broadcastRow] = await db
    .insert(schema.broadcasts)
    .values({
      message: body.message,
      targetEmployeeIds: body.targetEmployeeIds ?? null,
      createdBy: auth.admin.id,
    })
    .returning();

  // Determine target users
  let targetUsers: { userId: string; employeeId: string; email: string; displayName: string }[] =
    [];

  if (!body.targetEmployeeIds) {
    // All active employees
    const rows = await db
      .select({
        userId: schema.employees.userId,
        employeeId: schema.employees.id,
        email: schema.users.email,
        displayName: schema.users.displayName,
      })
      .from(schema.employees)
      .leftJoin(schema.users, eq(schema.users.id, schema.employees.userId))
      .where(eq(schema.employees.employmentStatus, "active"));

    targetUsers = rows
      .filter((r) => r.userId && r.email)
      .map((r) => ({
        userId: r.userId!,
        employeeId: r.employeeId,
        email: r.email!,
        displayName: r.displayName ?? "",
      }));
  } else {
    // Specific employees by id
    const rows = await db
      .select({
        userId: schema.employees.userId,
        employeeId: schema.employees.id,
        email: schema.users.email,
        displayName: schema.users.displayName,
      })
      .from(schema.employees)
      .leftJoin(schema.users, eq(schema.users.id, schema.employees.userId));

    targetUsers = rows
      .filter((r) => r.userId && r.email && body.targetEmployeeIds!.includes(r.employeeId))
      .map((r) => ({
        userId: r.userId!,
        employeeId: r.employeeId,
        email: r.email!,
        displayName: r.displayName ?? "",
      }));
  }

  // Fan-out notifications
  for (const target of targetUsers) {
    try {
      await enqueueNotification({
        userId: target.userId,
        employeeId: target.employeeId,
        type: "broadcast.general",
        payload: { message: body.message, broadcastId: broadcastRow!.id },
        emailRender: () =>
          broadcastEmployeeEmail({
            to: target.email,
            recipientName: target.displayName,
            appUrl: APP_URL,
            ctaPath: "/dashboard",
            message: body.message,
          }),
      });
    } catch (e) {
      console.error("broadcast notify failed", { userId: target.userId, error: e });
    }
  }

  return NextResponse.json({ ok: true, broadcastId: broadcastRow!.id, sent: targetUsers.length });
}
