import type { EmployeeNotificationType } from "./types";

export const DEFAULT_EMAIL_PREFS: Record<EmployeeNotificationType, boolean> = {
  "leave.approved": true,
  "leave.rejected": true,
  "expense.approved": true,
  "expense.rejected": true,
  "hours.rejected": true,
  "hours.approved": false,
  "statement.ready": true,
  "payslip.available": true,
  "contract.uploaded": true,
  "bonus.paid": true,
  "address.change.approved": true,
  "iban.change.approved": true,
  "vacation.balance.low": true,
  "hours.missing.reminder": true,
  "vacation.unused.year-end": true,
  "broadcast.general": true,
};
