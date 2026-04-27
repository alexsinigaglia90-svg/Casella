import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./identity";

export const broadcasts = pgTable("broadcasts", {
  id: uuid("id").primaryKey().defaultRandom(),
  message: text("message").notNull(),
  targetEmployeeIds: text("target_employee_ids").array(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
