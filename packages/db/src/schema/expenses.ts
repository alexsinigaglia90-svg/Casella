import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  integer,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { employees, users } from "./identity";
import { projects } from "./work";
import { expenseCategoryEnum, expenseStatusEnum } from "./enums";

export const expenseClaims = pgTable("expense_claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  category: expenseCategoryEnum("category").notNull(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  isInternal: boolean("is_internal").notNull().default(false),
  amountCents: integer("amount_cents").notNull(),
  vatAmountCents: integer("vat_amount_cents"),
  date: date("date").notNull(),
  description: text("description").notNull(),
  receiptStoragePath: text("receipt_storage_path").notNull(),
  categoryPayload: jsonb("category_payload").$type<Record<string, unknown>>(),
  status: expenseStatusEnum("status").notNull().default("submitted"),
  submittedAt: timestamp("submitted_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedBy: uuid("decided_by").references(() => users.id, {
    onDelete: "set null",
  }),
  rejectionReason: text("rejection_reason"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  nmbrsSyncedAt: timestamp("nmbrs_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
