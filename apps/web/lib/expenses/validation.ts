import { dateIsoSchema, uuidSchema } from "@casella/types";
import { z } from "zod";


export const expenseSubmitSchema = z
  .object({
    category: z.enum([
      "travel",
      "client_meal",
      "conference",
      "materials",
      "software",
      "telecom",
      "client_gift",
      "other",
    ]),
    projectId: uuidSchema.nullable(),
    isInternal: z.boolean(),
    amountCents: z.number().int().min(1),
    date: dateIsoSchema,
    description: z.string().min(1).max(500),
    receiptStoragePath: z.string().min(1),
    categoryPayload: z.record(z.unknown()).optional(),
  })
  .refine((d) => d.isInternal === (d.projectId === null), {
    message: "isInternal moet matchen met projectId",
  });

export type ExpenseSubmitInput = z.infer<typeof expenseSubmitSchema>;

export const rejectExpenseSchema = z.object({
  reason: z.string().min(1).max(500),
});
