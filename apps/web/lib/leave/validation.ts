import { dateIsoSchema } from "@casella/types";
import { z } from "zod";

import { LEAVE_TYPE_KEYS, isLeaveTypeKey } from "./types";

export const leaveSubmitSchema = z.object({
  type: z.string().refine(isLeaveTypeKey, {
    message: `type moet een van: ${LEAVE_TYPE_KEYS.join(", ")}`,
  }),
  startDate: dateIsoSchema,
  endDate: dateIsoSchema.optional().nullable(),
  hours: z.number().min(1).max(40 * 26),
  notes: z.string().max(500).optional().nullable(),
  customPayload: z.record(z.unknown()).optional(),
});

export type LeaveSubmitInput = z.infer<typeof leaveSubmitSchema>;
