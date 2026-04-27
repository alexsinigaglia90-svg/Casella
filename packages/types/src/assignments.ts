import { z } from "zod";

import { dateIsoSchema, uuidSchema } from "./common";
import { compensationTypeSchema } from "./employees";

/**
 * Schema for creating a Project Assignment — a junction-row that pairs an
 * `employees.id` with a `projects.id`. Optional date-window and per-assignment
 * compensation overrides (kmRate / compensationType) override the employee's
 * defaults for hours booked against this project.
 */
export const createAssignmentSchema = z.object({
  projectId: uuidSchema,
  employeeId: uuidSchema,
  startDate: dateIsoSchema.optional().nullable(),
  endDate: dateIsoSchema.optional().nullable(),
  kmRateCents: z.number().int().min(0).optional().nullable(),
  compensationType: compensationTypeSchema.optional().nullable(),
});
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const updateAssignmentSchema = createAssignmentSchema.partial().extend({
  id: uuidSchema,
});
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;

/**
 * Assignment row shape as returned by the API. Mirrors the Drizzle
 * `project_assignments` table, with timestamps serialized as ISO strings.
 */
export interface Assignment {
  id: string;
  projectId: string;
  employeeId: string;
  startDate: string | null;
  endDate: string | null;
  kmRateCents: number | null;
  compensationType: ("auto" | "ov" | "none") | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Enriched response shape for GET /api/admin/assignments/[id] — joins the
 * project, client and employee names so detail-views and edit-drawers don't
 * need extra fetches.
 */
export interface AssignmentEnriched extends Assignment {
  projectName: string;
  clientName: string;
  employeeName: string;
}

/**
 * Fields the new-assignment wizard treats as REQUIRED at the UI level.
 */
export const REQUIRED_CREATE_ASSIGNMENT_FIELDS = [
  "projectId",
  "employeeId",
] as const;

export type RequiredCreateAssignmentField =
  (typeof REQUIRED_CREATE_ASSIGNMENT_FIELDS)[number];
