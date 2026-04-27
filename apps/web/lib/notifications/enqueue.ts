import "server-only";
import { getDb, schema } from "@casella/db";
import { sendEmail, type SendEmailInput } from "@casella/email";

import { shouldSendEmail } from "./preferences";
import type {
  EmployeeNotificationType,
  AdminNotificationType,
} from "./types";
import { EMAILABLE_EMPLOYEE_TYPES } from "./types";

export interface EnqueueArgs {
  userId: string;
  employeeId?: string;
  type: EmployeeNotificationType | AdminNotificationType;
  payload: Record<string, unknown>;
  emailRender?: () => SendEmailInput;
}

export async function enqueueNotification({
  userId,
  employeeId,
  type,
  payload,
  emailRender,
}: EnqueueArgs): Promise<void> {
  const db = getDb();
  await db.insert(schema.notifications).values({
    userId,
    type,
    payloadJson: payload,
  });

  if (
    employeeId &&
    emailRender &&
    EMAILABLE_EMPLOYEE_TYPES.has(type as EmployeeNotificationType)
  ) {
    const ok = await shouldSendEmail(
      employeeId,
      type as EmployeeNotificationType,
    );
    if (!ok) return;
    const tpl = emailRender();
    try {
      await sendEmail(tpl);
    } catch (e) {
      console.error("notification email failed", { type, userId, error: e });
    }
  }
}
