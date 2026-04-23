import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "employee"]);

export const employmentStatusEnum = pgEnum("employment_status", [
  "active",
  "on_leave",
  "sick",
  "terminated",
]);

export const compensationTypeEnum = pgEnum("compensation_type", [
  "auto",
  "ov",
  "none",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "planned",
  "active",
  "completed",
  "cancelled",
]);

export const hourStatusEnum = pgEnum("hour_status", [
  "draft",
  "submitted",
  "approved",
  "rejected",
]);

export const leaveTypeEnum = pgEnum("leave_type", [
  "vacation",
  "special",
  "parental",
  "unpaid",
  "other",
]);

export const leaveStatusEnum = pgEnum("leave_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

export const statementPurposeEnum = pgEnum("statement_purpose", [
  "mortgage",
  "rent",
  "other",
]);

export const statementStatusEnum = pgEnum("statement_status", [
  "requested",
  "generated",
  "signed",
  "delivered",
  "cancelled",
]);

export const bonusLedgerTypeEnum = pgEnum("bonus_ledger_type", [
  "accrual",
  "adjustment",
  "payout",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "contract",
  "signed_statement",
  "other",
]);

export const documentSourceEnum = pgEnum("document_source", ["nmbrs", "upload"]);

export const themePreferenceEnum = pgEnum("theme_preference", [
  "light",
  "dark",
  "system",
]);
