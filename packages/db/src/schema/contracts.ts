import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";
import { employees, users } from "./identity";

export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  jobTitle: text("job_title").notNull(),
  pdfStoragePath: text("pdf_storage_path").notNull(),

  brutoSalarisMaandCents: numeric("bruto_salaris_maand_cents", {
    precision: 12,
    scale: 2,
  }),
  vakantietoeslagPct: numeric("vakantietoeslag_pct", {
    precision: 5,
    scale: 2,
  }).default("8.00"),
  baselineTariefPerUur: numeric("baseline_tarief_per_uur", {
    precision: 8,
    scale: 2,
  }).default("75.00"),
  bonusPctBelowBaseline: numeric("bonus_pct_below_baseline", {
    precision: 5,
    scale: 2,
  }).default("10.00"),
  bonusPctAboveBaseline: numeric("bonus_pct_above_baseline", {
    precision: 5,
    scale: 2,
  }).default("15.00"),
  maxOverperformancePct: numeric("max_overperformance_pct", {
    precision: 5,
    scale: 2,
  }).default("20.00"),
  autoStelpostActief: boolean("auto_stelpost_actief").notNull().default(false),
  autoStelpostBedragMaand: numeric("auto_stelpost_bedrag_maand", {
    precision: 10,
    scale: 2,
  }).default("1000.00"),

  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  uploadedBy: uuid("uploaded_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
