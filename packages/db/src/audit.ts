import type { Database } from "./client";
import { auditLog } from "./schema/system";

/**
 * Inferred transaction type from Database so we get full type-safety on
 * tx.insert() without resorting to PgTransaction<any, any, any>.
 */
export type DbTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

export interface AuditInput {
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  changesJson?: Record<string, unknown>;
}

/**
 * Write a row into the `audit_log` table inside an open transaction.
 * Must be called from within a `db.transaction()` block so the audit-log
 * write is atomic with the business mutation.
 *
 * Pass `actorUserId: null` for actions triggered by system processes
 * (cron jobs, webhooks, scheduled terminations) rather than a human user.
 */
export async function auditMutation(
  tx: DbTransaction,
  input: AuditInput
): Promise<void> {
  await tx.insert(auditLog).values({
    actorUserId: input.actorUserId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    changesJson: input.changesJson,
  });
}
