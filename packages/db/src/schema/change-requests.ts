import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { employees, users } from "./identity";
import { changeRequestTypeEnum, changeRequestStatusEnum } from "./enums";

export const employeeChangeRequests = pgTable("employee_change_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  type: changeRequestTypeEnum("type").notNull(),
  proposedValue: jsonb("proposed_value")
    .notNull()
    .$type<Record<string, unknown>>(),
  status: changeRequestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedBy: uuid("decided_by").references(() => users.id, {
    onDelete: "set null",
  }),
  rejectionReason: text("rejection_reason"),
});
