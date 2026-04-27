import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { employees } from "./identity";
import {
  carePackageCompanyEnum,
  carePackageLedgerTypeEnum,
} from "./enums";

export const carePackageLedger = pgTable("care_package_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  type: carePackageLedgerTypeEnum("type").notNull(),
  company: carePackageCompanyEnum("company").notNull(),
  amountCents: integer("amount_cents").notNull(),
  year: integer("year").notNull(),
  transactionRef: text("transaction_ref"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
