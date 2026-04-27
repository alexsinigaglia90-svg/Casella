import { redirect } from "next/navigation";

import { PayslipList } from "@/features/payslips/payslip-list";
import { getCurrentEmployee } from "@/lib/current-employee";
import { listPayslipsForEmployee } from "@/lib/nmbrs/payslips";

export const dynamic = "force-dynamic";

export default async function LoonstrokenPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/dashboard");

  const result = await listPayslipsForEmployee(employee.id);

  const payslips = "ok" in result ? result.payslips : [];
  const skipped = "skipped" in result ? result.skipped : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h1
          className="text-2xl font-semibold"
          style={{ color: "var(--fg-primary)" }}
        >
          Loonstroken
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          Jouw loonstroken uit Nmbrs, de laatste 2 jaar.
        </p>
      </header>

      <PayslipList payslips={payslips} skipped={skipped} />
    </div>
  );
}
