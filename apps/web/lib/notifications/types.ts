export const EMPLOYEE_NOTIFICATION_TYPES = [
  "leave.approved",
  "leave.rejected",
  "expense.approved",
  "expense.rejected",
  "hours.rejected",
  "hours.approved",
  "statement.ready",
  "payslip.available",
  "contract.uploaded",
  "bonus.paid",
  "address.change.approved",
  "iban.change.approved",
  "vacation.balance.low",
  "hours.missing.reminder",
  "vacation.unused.year-end",
  "broadcast.general",
] as const;

export type EmployeeNotificationType =
  (typeof EMPLOYEE_NOTIFICATION_TYPES)[number];

export const ADMIN_NOTIFICATION_TYPES = [
  "leave.submitted",
  "sick.submitted",
  "expense.submitted",
  "address.change.requested",
  "iban.change.requested",
  "termination.upcoming",
] as const;

export type AdminNotificationType =
  (typeof ADMIN_NOTIFICATION_TYPES)[number];

export const EMAILABLE_EMPLOYEE_TYPES: ReadonlySet<EmployeeNotificationType> =
  new Set(EMPLOYEE_NOTIFICATION_TYPES);
