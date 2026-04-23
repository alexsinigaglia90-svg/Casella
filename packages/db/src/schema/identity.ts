import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  date,
} from "drizzle-orm/pg-core";
import {
  userRoleEnum,
  employmentStatusEnum,
  compensationTypeEnum,
} from "./enums";
import { addresses } from "./addresses";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  entraOid: text("entra_oid").notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: userRoleEnum("role").notNull().default("employee"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
});

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  nmbrsEmployeeId: text("nmbrs_employee_id").unique(),
  homeAddressId: uuid("home_address_id").references(() => addresses.id),
  employmentStatus: employmentStatusEnum("employment_status")
    .notNull()
    .default("active"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  defaultKmRateCents: integer("default_km_rate_cents").notNull().default(23),
  compensationType: compensationTypeEnum("compensation_type")
    .notNull()
    .default("auto"),
  managerId: uuid("manager_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
