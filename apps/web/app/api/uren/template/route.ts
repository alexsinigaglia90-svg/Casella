import { apiError } from "@casella/types";
import { NextResponse, type NextRequest } from "next/server";

import { getCurrentEmployee } from "@/lib/current-employee";
import { getEmployeeWeek } from "@/lib/hours/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const employee = await getCurrentEmployee();
  if (!employee) {
    return NextResponse.json(
      apiError("unauthenticated", "Niet ingelogd"),
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const prevWeek = url.searchParams.get("prevWeek");
  if (!prevWeek) {
    return NextResponse.json(
      apiError("missing_param", "prevWeek vereist"),
      { status: 400 },
    );
  }

  const data = await getEmployeeWeek(employee.id, prevWeek);
  return NextResponse.json({
    entries: data.entries.map((e) => ({
      projectId: e.projectId,
      workDate: e.workDate,
      hours: Number(e.hours),
      notes: e.notes,
    })),
  });
}
