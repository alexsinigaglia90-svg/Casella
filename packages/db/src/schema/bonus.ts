import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { bonusLedgerTypeEnum } from "./enums";
import { users, employees } from "./identity";

export const bonusLedger = pgTable("bonus_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  period: text("period").notNull(),
  amountCents: integer("amount_cents").notNull(),
  type: bonusLedgerTypeEnum("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
});
