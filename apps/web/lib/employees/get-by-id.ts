import "server-only";

import { getDb, schema, eq } from "@casella/db";
import type { EmployeeWithAddress } from "@casella/types";
import { cache } from "react";

/**
 * Server-side fetch for a single employee with joined home-address.
 *
 * Canonical loader for the parallel + intercepting routes (T12 / B-2):
 *  - `app/(admin)/admin/medewerkers/[id]/page.tsx` (full-page fallback)
 *  - `app/(admin)/admin/medewerkers/@modal/(.)[id]/page.tsx` (drawer overlay)
 *
 * Wrapped in `React.cache` so both pages can call it during the same render
 * pass without paying a second DB round-trip. Mirrors the GET-endpoint at
 * `app/api/admin/employees/[id]/route.ts` (Date columns → ISO strings).
 */
export const getEmployeeById = cache(
  async (id: string): Promise<EmployeeWithAddress | null> => {
    const db = getDb();
    const [emp] = await db
      .select()
      .from(schema.employees)
      .where(eq(schema.employees.id, id));
    if (!emp) return null;

    let address: EmployeeWithAddress["address"] = null;
    if (emp.homeAddressId) {
      const [addr] = await db
        .select()
        .from(schema.addresses)
        .where(eq(schema.addresses.id, emp.homeAddressId));
      if (addr) {
        address = {
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
        };
      }
    }

    return {
      id: emp.id,
      userId: emp.userId,
      inviteEmail: emp.inviteEmail,
      nmbrsEmployeeId: emp.nmbrsEmployeeId,
      homeAddressId: emp.homeAddressId,
      employmentStatus: emp.employmentStatus,
      startDate: emp.startDate ?? null,
      endDate: emp.endDate ?? null,
      defaultKmRateCents: emp.defaultKmRateCents,
      compensationType: emp.compensationType,
      contractedHoursPerWeek: emp.contractedHoursPerWeek,
      managerId: emp.managerId,
      phone: emp.phone,
      emergencyContactName: emp.emergencyContactName,
      emergencyContactPhone: emp.emergencyContactPhone,
      firstName: emp.firstName,
      lastName: emp.lastName,
      avatarUrl: emp.avatarUrl,
      jobTitle: emp.jobTitle,
      notes: emp.notes,
      pendingTerminationAt: emp.pendingTerminationAt ?? null,
      pendingTerminationReason: emp.pendingTerminationReason,
      terminationUndoUntil: emp.terminationUndoUntil?.toISOString() ?? null,
      createdAt: emp.createdAt.toISOString(),
      updatedAt: emp.updatedAt.toISOString(),
      address,
    };
  },
);
