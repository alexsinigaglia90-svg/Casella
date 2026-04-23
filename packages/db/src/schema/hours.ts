import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  numeric,
} from "drizzle-orm/pg-core";
import { hourStatusEnum } from "./enums";
import { users, employees } from "./identity";
import { projects } from "./work";

export const hourEntries = pgTable("hour_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "restrict" }),
  workDate: date("work_date").notNull(),
  hours: numeric("hours", { precision: 4, scale: 2 }).notNull(),
  kmCached: numeric("km_cached", { precision: 8, scale: 2 }),
  notes: text("notes"),
  status: hourStatusEnum("status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedBy: uuid("approved_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  nmbrsSyncedAt: timestamp("nmbrs_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
