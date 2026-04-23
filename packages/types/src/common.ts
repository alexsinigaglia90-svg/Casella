import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const nonEmptyStringSchema = z.string().min(1);

export const dateIsoSchema = z.string().date();

export const roleSchema = z.enum(["admin", "employee"]);
export type Role = z.infer<typeof roleSchema>;
