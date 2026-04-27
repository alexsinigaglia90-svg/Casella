import { z } from "zod";

import { dateIsoSchema, uuidSchema } from "./common";

export const hourStatusSchema = z.enum([
  "draft",
  "submitted",
  "approved",
  "rejected",
]);
export type HourStatus = z.infer<typeof hourStatusSchema>;

export const hourEntryUpsertSchema = z.object({
  projectId: uuidSchema,
  workDate: dateIsoSchema,
  hours: z.number().min(0).max(24),
  notes: z.string().max(500).optional().nullable(),
});
export type HourEntryUpsertInput = z.infer<typeof hourEntryUpsertSchema>;

export const weekUpsertSchema = z.object({
  weekStart: dateIsoSchema, // monday of week
  entries: z.array(hourEntryUpsertSchema),
});
export type WeekUpsertInput = z.infer<typeof weekUpsertSchema>;

export const submitWeekSchema = z.object({
  weekStart: dateIsoSchema,
});

export const rejectEntrySchema = z.object({
  reason: z.string().min(1).max(500),
});

export interface HourEntry {
  id: string;
  employeeId: string;
  projectId: string;
  workDate: string;
  hours: string; // numeric kept as string by Drizzle
  kmCached: string | null;
  notes: string | null;
  status: HourStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectionReason: string | null;
  nmbrsSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HourEntryEnriched extends HourEntry {
  projectName: string;
  clientName: string;
  employeeName: string;
}
