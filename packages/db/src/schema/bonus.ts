import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  date,
  numeric,
} from "drizzle-orm/pg-core";
import { bonusLedgerTypeEnum } from "./enums";
import { users, employees } from "./identity";
import { projects } from "./work";

export const bonusLedger = pgTable("bonus_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  period: text("period").notNull(),
  amountCents: integer("amount_cents").notNull(),
  type: bonusLedgerTypeEnum("type").notNull(),
  description: text("description"),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  bonusPeriodStart: date("bonus_period_start"),
  bonusPeriodEnd: date("bonus_period_end"),
  pctApplied: numeric("pct_applied", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
});
