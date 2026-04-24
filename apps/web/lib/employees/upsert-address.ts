import { schema, eq, type DbTransaction } from "@casella/db";
import type { AddressInput } from "@casella/types";

export async function upsertAddress(tx: DbTransaction, input: AddressInput): Promise<string> {
  const existing = await tx
    .select({ id: schema.addresses.id })
    .from(schema.addresses)
    .where(eq(schema.addresses.pdokId, input.pdokId))
    .limit(1);
  if (existing[0]) return existing[0].id;

  const [created] = await tx.insert(schema.addresses).values({
    pdokId: input.pdokId,
    street: input.street,
    houseNumber: input.houseNumber,
    houseNumberAddition: input.houseNumberAddition,
    postalCode: input.postalCode,
    city: input.city,
    municipality: input.municipality,
    province: input.province,
    country: input.country,
    lat: input.lat,
    lng: input.lng,
    rdX: input.rdX,
    rdY: input.rdY,
    fullAddressDisplay: input.fullDisplay,
  }).returning({ id: schema.addresses.id });

  return created!.id;
}
