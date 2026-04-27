import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { statementPurposeEnum, statementStatusEnum } from "./enums";
import { employees } from "./identity";

export const employerStatements = pgTable("employer_statements", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  purpose: statementPurposeEnum("purpose").notNull(),
  purposeNote: text("purpose_note"),
  status: statementStatusEnum("status").notNull().default("requested"),
  generatedPdfPath: text("generated_pdf_path"),
  signedPdfPath: text("signed_pdf_path"),
  signatureProviderRef: text("signature_provider_ref"),
  nhgIndicator: boolean("nhg_indicator"),
  lenderName: text("lender_name"),
  loanAmountIndicativeCents: integer("loan_amount_indicative_cents"),
  landlordName: text("landlord_name"),
  landlordAddress: text("landlord_address"),
  monthlyRentCents: integer("monthly_rent_cents"),
  purposeOtherReason: text("purpose_other_reason"),
  requestedAt: timestamp("requested_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
});
