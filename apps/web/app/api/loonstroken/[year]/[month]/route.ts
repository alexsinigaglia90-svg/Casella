import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentEmployee } from "@/lib/current-employee";
import { streamPayslipPdf } from "@/lib/nmbrs/payslips";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ year: string; month: string }> },
) {
  const employee = await getCurrentEmployee();
  if (!employee) {
    return NextResponse.json(
      apiError("unauthenticated", "Niet ingelogd"),
      { status: 401 },
    );
  }

  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (Number.isNaN(year) || Number.isNaN(month)) {
    return NextResponse.json(
      apiError("invalid_params", "Ongeldig jaar of periode"),
      { status: 400 },
    );
  }

  const base64 = await streamPayslipPdf(employee.id, year, month);
  if (!base64) {
    return NextResponse.json(
      apiError("not_found", "Loonstrook niet beschikbaar"),
      { status: 404 },
    );
  }

  const buffer = Buffer.from(base64, "base64");
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="loonstrook-${year}-${month}.pdf"`,
      "Content-Length": String(buffer.length),
    },
  });
}
