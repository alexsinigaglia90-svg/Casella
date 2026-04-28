import { redirect } from "next/navigation";

import { PayslipHero } from "@/features/payslips/payslip-hero";
import { PayslipHistory } from "@/features/payslips/payslip-history";
import { PayslipJaaropgaven } from "@/features/payslips/payslip-jaaropgaven";
import { getCurrentEmployee } from "@/lib/current-employee";
import { listPayslipsForEmployee } from "@/lib/nmbrs/payslips";

export const dynamic = "force-dynamic";

export default async function LoonstrokenPage() {
  const employee = await getCurrentEmployee();
  if (!employee) redirect("/dashboard");

  const result = await listPayslipsForEmployee(employee.id);
  const payslips = "ok" in result ? result.payslips : [];
  const skipped = "skipped" in result ? result.skipped : undefined;

  // Sort: latest year + period first → hero is most recent
  const sorted = [...payslips].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.period - a.period;
  });
  const [hero, ...rest] = sorted;

  const employeeName = [employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto max-w-5xl space-y-12 p-6">
      <div>
        <div
          className="mb-3 font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            color: "var(--fg-tertiary)",
          }}
        >
          Mijn account · Loonstroken
        </div>

        {hero ? (
          <PayslipHero
            payslip={hero}
            employeeName={employeeName || "Medewerker"}
          />
        ) : (
          <div
            className="rounded-2xl border p-8 text-center text-sm"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--fg-tertiary)",
            }}
          >
            {skipped
              ? "Loonstroken verschijnen hier zodra Nmbrs gekoppeld is."
              : "Geen loonstroken gevonden."}
          </div>
        )}
      </div>

      <PayslipHistory payslips={rest} />

      <PayslipJaaropgaven skipped={skipped} />
    </div>
  );
}
