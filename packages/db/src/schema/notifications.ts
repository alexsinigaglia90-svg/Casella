import { pgTable, uuid, timestamp, date, numeric } from "drizzle-orm/pg-core";
import { employees } from "./identity";

export const reminderLogs = pgTable("reminder_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  weekStart: date("week_start").notNull(),
  hoursAtTime: numeric("hours_at_time", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});
