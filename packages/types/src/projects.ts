import { z } from "zod";

import { dateIsoSchema, nonEmptyStringSchema, uuidSchema } from "./common";

/**
 * Project status — mirrors `projectStatusEnum` in `packages/db/src/schema/enums.ts`.
 */
export const projectStatusSchema = z.enum([
  "planned",
  "active",
  "completed",
  "cancelled",
]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

/**
 * Schema for creating a Project. A project is always tied to a client
 * (`clients.id`) — required from day one. Dates and description are optional.
 */
export const createProjectSchema = z.object({
  clientId: uuidSchema,
  name: nonEmptyStringSchema,
  description: z.string().max(5000).optional().nullable(),
  startDate: dateIsoSchema.optional().nullable(),
  endDate: dateIsoSchema.optional().nullable(),
  status: projectStatusSchema.default("planned"),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: uuidSchema,
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/**
 * Project row shape as returned by the API. Mirrors the Drizzle `projects`
 * table, with Date columns serialized as ISO strings.
 */
export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Enriched response shape for GET /api/admin/projects/[id] — joins the
 * client name so detail-views and edit-drawers don't need a second fetch.
 */
export interface ProjectWithClient extends Project {
  clientName: string;
}

/**
 * Fields the new-project wizard treats as REQUIRED at the UI level.
 */
export const REQUIRED_CREATE_PROJECT_FIELDS = ["clientId", "name"] as const;

export type RequiredCreateProjectField =
  (typeof REQUIRED_CREATE_PROJECT_FIELDS)[number];
