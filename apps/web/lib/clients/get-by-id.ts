import "server-only";

import { getDb, schema, eq } from "@casella/db";
import type { ClientWithAddress } from "@casella/types";
import { cache } from "react";

/**
 * Server-side fetch for a single client with joined address.
 *
 * Canonical loader for the parallel + intercepting routes:
 *  - `app/(admin)/admin/klanten/[id]/page.tsx` (full-page fallback)
 *  - `app/(admin)/admin/klanten/@modal/(.)[id]/page.tsx` (drawer overlay)
 *
 * Wrapped in `React.cache` so both pages can call it during the same render
 * pass without paying a second DB round-trip. Mirrors the GET-endpoint at
 * `app/api/admin/clients/[id]/route.ts` (Date columns → ISO strings).
 */
export const getClientById = cache(
  async (id: string): Promise<ClientWithAddress | null> => {
    const db = getDb();
    const [client] = await db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.id, id));
    if (!client) return null;

    const [addr] = await db
      .select()
      .from(schema.addresses)
      .where(eq(schema.addresses.id, client.addressId));
    if (!addr) return null;

    return {
      id: client.id,
      name: client.name,
      kvk: client.kvk,
      contactName: client.contactName,
      contactEmail: client.contactEmail,
      contactPhone: client.contactPhone,
      addressId: client.addressId,
      archivedAt: client.archivedAt?.toISOString() ?? null,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
      address: {
        pdokId: addr.pdokId ?? "",
        street: addr.street,
        houseNumber: addr.houseNumber,
        houseNumberAddition: addr.houseNumberAddition,
        postalCode: addr.postalCode,
        city: addr.city,
        municipality: addr.municipality,
        province: addr.province,
        country: addr.country as "NL",
        lat: addr.lat ?? 0,
        lng: addr.lng ?? 0,
        rdX: addr.rdX,
        rdY: addr.rdY,
        fullDisplay: addr.fullAddressDisplay ?? "",
      },
    };
  },
);
