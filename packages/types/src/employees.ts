import { z } from "zod";
import { emailSchema, nonEmptyStringSchema, uuidSchema, dateIsoSchema } from "./common";

export const employmentStatusSchema = z.enum([
  "active",
  "on_leave",
  "sick",
  "terminated",
]);
export type EmploymentStatus = z.infer<typeof employmentStatusSchema>;

export const compensationTypeSchema = z.enum(["auto", "ov", "none"]);
export type CompensationType = z.infer<typeof compensationTypeSchema>;

export const addressInputSchema = z.object({
  pdokId: z.string(),
  street: nonEmptyStringSchema,
  houseNumber: nonEmptyStringSchema,
  houseNumberAddition: z.string().nullable(),
  postalCode: nonEmptyStringSchema,
  city: nonEmptyStringSchema,
  municipality: z.string().nullable(),
  province: z.string().nullable(),
  country: z.literal("NL"),
  lat: z.number(),
  lng: z.number(),
  rdX: z.number().nullable(),
  rdY: z.number().nullable(),
  fullDisplay: z.string(),
});
export type AddressInput = z.infer<typeof addressInputSchema>;

export const createEmployeeSchema = z.object({
  inviteEmail: emailSchema,
  nmbrsEmployeeId: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  startDate: dateIsoSchema.optional().nullable(),
  managerId: uuidSchema.optional().nullable(),
  contractedHoursPerWeek: z.number().int().min(1).max(60).default(40),
  defaultKmRateCents: z.number().int().min(0).default(23),
  compensationType: compensationTypeSchema.default("auto"),
  homeAddress: addressInputSchema.optional().nullable(),
  phone: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  id: uuidSchema,
});
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const initiateTerminateSchema = z.object({
  id: uuidSchema,
  pendingTerminationAt: dateIsoSchema,
  reason: z.string().max(1000).optional(),
  confirmText: nonEmptyStringSchema,
});
export type InitiateTerminateInput = z.infer<typeof initiateTerminateSchema>;

/**
 * Fields that the new-employee wizard treats as REQUIRED at the UI level.
 * The Zod schema itself stays permissive so mobile / AstraSign / Nmbrs sync
 * can post partial records — but every web/mobile create-form should validate
 * against this same list to avoid divergence between platforms.
 */
export const REQUIRED_CREATE_EMPLOYEE_FIELDS = [
  "firstName",
  "lastName",
  "inviteEmail",
  "phone",
  "jobTitle",
  "startDate",
  "contractedHoursPerWeek",
  "compensationType",
  "homeAddress",
  "emergencyContactName",
] as const;

export type RequiredCreateEmployeeField = (typeof REQUIRED_CREATE_EMPLOYEE_FIELDS)[number];
