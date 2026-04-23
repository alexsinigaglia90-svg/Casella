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
  themePreferenceEnum,
} from "./enums";
import { addresses } from "./addresses";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  entraOid: text("entra_oid").notNull().unique(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: userRoleEnum("role").notNull().default("employee"),
  themePreference: themePreferenceEnum("theme_preference")
    .notNull()
    .default("system"),
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
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  inviteEmail: text("invite_email"),
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
  contractedHoursPerWeek: integer("contracted_hours_per_week").notNull().default(40),
  managerId: uuid("manager_id").references(() => users.id),
  phone: text("phone"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  avatarUrl: text("avatar_url"),
  jobTitle: text("job_title"),
  notes: text("notes"),
  pendingTerminationAt: date("pending_termination_at"),
  pendingTerminationReason: text("pending_termination_reason"),
  terminationUndoUntil: timestamp("termination_undo_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
