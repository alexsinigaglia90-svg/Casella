import { eq, getDb, schema } from "@casella/db";
import { redirect } from "next/navigation";

import { ContractUploadForm } from "@/features/contracts/admin/contract-upload-form";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AdminContractenPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/dashboard");

  const db = getDb();
  const employees = await db
    .select({
      id: schema.employees.id,
      firstName: schema.employees.firstName,
      lastName: schema.employees.lastName,
      displayName: schema.users.displayName,
    })
    .from(schema.employees)
    .leftJoin(schema.users, eq(schema.employees.userId, schema.users.id))
    .where(eq(schema.employees.employmentStatus, "active"))
    .orderBy(schema.employees.firstName);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Contracten uploaden
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          Upload een nieuw contract voor een medewerker. De medewerker ontvangt een e-mailmelding.
        </p>
      </header>

      <ContractUploadForm employees={employees} />
    </div>
  );
}
