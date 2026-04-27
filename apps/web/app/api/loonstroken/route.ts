import { apiError } from "@casella/types";
import { NextResponse } from "next/server";

import { getCurrentEmployee } from "@/lib/current-employee";
import { listPayslipsForEmployee } from "@/lib/nmbrs/payslips";

export const dynamic = "force-dynamic";

export async function GET() {
  const employee = await getCurrentEmployee();
  if (!employee) {
    return NextResponse.json(
      apiError("unauthenticated", "Niet ingelogd"),
      { status: 401 },
    );
  }

  const result = await listPayslipsForEmployee(employee.id);

  if ("skipped" in result) {
    return NextResponse.json({ payslips: [], skipped: result.skipped });
  }

  return NextResponse.json({ payslips: result.payslips });
}
