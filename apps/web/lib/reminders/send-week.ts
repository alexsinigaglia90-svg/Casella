import "server-only";

import { and, eq, getDb, gte, lte, schema, sql } from "@casella/db";
import { reminderEmail, sendEmail } from "@casella/email";

const REMINDER_THRESHOLD_HOURS = 30;

export interface SendRemindersResult {
  weekStart: string;
  candidates: number;
  sent: number;
  skipped: number;
  errors: string[];
}

function asIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function mondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay() || 7; // 1..7 (Mon=1)
  if (day !== 1) d.setDate(d.getDate() - (day - 1));
  return asIso(d);
}

const NL_DAYS = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const NL_MONTHS = [
  "jan",
  "feb",
  "mrt",
  "apr",
  "mei",
  "jun",
  "jul",
  "aug",
  "sep",
  "okt",
  "nov",
  "dec",
];

function fmtDay(iso: string): string {
  const d = new Date(iso);
  return `${NL_DAYS[d.getDay()]} ${d.getDate()} ${NL_MONTHS[d.getMonth()]}`;
}

export async function sendRemindersForWeek(
  weekStart?: string,
  appUrl = "http://localhost:3000",
): Promise<SendRemindersResult> {
  const db = getDb();
  const ws = weekStart ?? mondayOf(new Date());
  const we = new Date(ws);
  we.setDate(we.getDate() + 6);
  const weIso = asIso(we);

  // Find active employees (with optional linked auth user for email).
  const employees = await db
    .select({
      id: schema.employees.id,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
      inviteEmail: schema.employees.inviteEmail,
      userEmail: schema.users.email,
    })
    .from(schema.employees)
    .leftJoin(schema.users, eq(schema.employees.userId, schema.users.id))
    .where(eq(schema.employees.employmentStatus, "active"));

  const errors: string[] = [];
  let sent = 0;
  let skipped = 0;

  for (const emp of employees) {
    const email = emp.userEmail ?? emp.inviteEmail;
    if (!email) {
      skipped++;
      continue;
    }

    // Sum hours this week.
    const [h] = await db
      .select({ total: sql<string>`COALESCE(SUM(${schema.hourEntries.hours}), 0)` })
      .from(schema.hourEntries)
      .where(
        and(
          eq(schema.hourEntries.employeeId, emp.id),
          gte(schema.hourEntries.workDate, ws),
          lte(schema.hourEntries.workDate, weIso),
        ),
      );
    const totalHours = Number(h?.total ?? 0);
    if (totalHours >= REMINDER_THRESHOLD_HOURS) {
      skipped++;
      continue;
    }

    // Idempotent: only one reminder per employee per week.
    const [existing] = await db
      .select({ id: schema.reminderLogs.id })
      .from(schema.reminderLogs)
      .where(
        and(
          eq(schema.reminderLogs.employeeId, emp.id),
          eq(schema.reminderLogs.weekStart, ws),
        ),
      );
    if (existing) {
      skipped++;
      continue;
    }

    try {
      const tpl = reminderEmail({
        to: email,
        firstName: emp.firstName,
        weekStart: ws,
        weekStartPretty: fmtDay(ws),
        weekEndPretty: fmtDay(weIso),
        hoursAtTime: totalHours,
        appUrl,
      });
      await sendEmail({
        to: email,
        subject: tpl.subject,
        text: tpl.text,
        html: tpl.html,
      });
      await db.insert(schema.reminderLogs).values({
        employeeId: emp.id,
        weekStart: ws,
        hoursAtTime: totalHours.toFixed(2),
      });
      sent++;
    } catch (e) {
      errors.push(
        `${email}: ${e instanceof Error ? e.message : String(e)}`,
      );
      skipped++;
    }
  }

  return {
    weekStart: ws,
    candidates: employees.length,
    sent,
    skipped,
    errors,
  };
}
