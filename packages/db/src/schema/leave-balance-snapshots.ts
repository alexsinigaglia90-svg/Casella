import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";
import { employees } from "./identity";

export const leaveBalanceSnapshots = pgTable("leave_balance_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  leaveType: text("leave_type").notNull(),
  hoursRemaining: numeric("hours_remaining", {
    precision: 7,
    scale: 2,
  }).notNull(),
  hoursTotal: numeric("hours_total", { precision: 7, scale: 2 }).notNull(),
  expiresAt: text("expires_at"),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
