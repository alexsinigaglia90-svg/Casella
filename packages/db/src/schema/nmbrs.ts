import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

import { users } from "./identity";

export const nmbrsSyncTypeEnum = pgEnum("nmbrs_sync_type", [
  "employees",
  "hours",
  "leave",
]);

export const nmbrsSyncStatusEnum = pgEnum("nmbrs_sync_status", [
  "running",
  "success",
  "failure",
]);

export const nmbrsSyncRuns = pgTable("nmbrs_sync_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  syncType: nmbrsSyncTypeEnum("sync_type").notNull(),
  status: nmbrsSyncStatusEnum("status").notNull().default("running"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  recordsProcessed: integer("records_processed").notNull().default(0),
  recordsSucceeded: integer("records_succeeded").notNull().default(0),
  recordsFailed: integer("records_failed").notNull().default(0),
  errorMessage: text("error_message"),
  errorDetails: jsonb("error_details").$type<unknown>(),
  triggeredBy: uuid("triggered_by").references(() => users.id, {
    onDelete: "set null",
  }),
});
