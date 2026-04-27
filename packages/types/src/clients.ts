import { z } from "zod";

import { emailSchema, nonEmptyStringSchema, uuidSchema } from "./common";
import { addressInputSchema, type AddressInput } from "./employees";

/**
 * Schema for creating a Client. The address is REQUIRED — clients
 * are tied to a billing/visit address from day one (mirrors employees'
 * homeAddress shape, but on `addresses` table directly).
 */
export const createClientSchema = z.object({
  name: nonEmptyStringSchema,
  kvk: z.string().max(20).optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactEmail: emailSchema.optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: addressInputSchema,
});
export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.partial().extend({
  id: uuidSchema,
});
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

/**
 * Client row shape as returned by the API. Mirrors the Drizzle `clients`
 * table, with Date columns serialized as ISO strings (JSON-over-the-wire).
 */
export interface Client {
  id: string;
  name: string;
  kvk: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  addressId: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Enriched response shape for GET /api/admin/clients/[id] — includes the
 * joined address (always present for clients; addressId is NOT NULL).
 */
export interface ClientWithAddress extends Client {
  address: AddressInput;
}

/**
 * Fields the new-client wizard treats as REQUIRED at the UI level.
 * Mirrors the employee pattern so mobile / API can post partial records
 * without breaking, but the web form validates against this list.
 */
export const REQUIRED_CREATE_CLIENT_FIELDS = ["name", "address"] as const;

export type RequiredCreateClientField = (typeof REQUIRED_CREATE_CLIENT_FIELDS)[number];
