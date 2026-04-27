import "server-only";

import { eq, getDb, schema } from "@casella/db";
import {
  getEmployeePayslips,
  getPayslipPdfBase64,
  type NmbrsPayslipSummary,
} from "@casella/nmbrs";
import { NmbrsError } from "@casella/nmbrs";

type PayslipsResult =
  | { ok: true; payslips: NmbrsPayslipSummary[] }
  | { skipped: string; payslips: [] };

export async function listPayslipsForEmployee(
  employeeId: string,
  years = 2,
): Promise<PayslipsResult> {
  const db = getDb();
  const empRows = await db
    .select({ nmbrsEmployeeId: schema.employees.nmbrsEmployeeId })
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))
    .limit(1);
  const emp = empRows[0];
  const nmbrsId = emp?.nmbrsEmployeeId;

  if (!nmbrsId) {
    return { skipped: "no_nmbrs_employee_id", payslips: [] };
  }

  const currentYear = new Date().getFullYear();
  const allPayslips: NmbrsPayslipSummary[] = [];

  for (let i = 0; i < years; i++) {
    const year = currentYear - i;
    try {
      const payslips = await getEmployeePayslips(nmbrsId, year);
      allPayslips.push(...payslips);
    } catch (e) {
      if (e instanceof NmbrsError && e.code === "missing_credentials") {
        return { skipped: "missing_credentials", payslips: [] };
      }
      if (e instanceof NmbrsError && e.code === "not_implemented") {
        return { skipped: "not_implemented", payslips: [] };
      }
      // Other errors: log and continue (best-effort per year)
      console.error("getEmployeePayslips failed", { nmbrsId, year, error: e });
    }
  }

  return { ok: true, payslips: allPayslips };
}

export async function streamPayslipPdf(
  employeeId: string,
  year: number,
  period: number,
): Promise<string | null> {
  const db = getDb();
  const empRows = await db
    .select({ nmbrsEmployeeId: schema.employees.nmbrsEmployeeId })
    .from(schema.employees)
    .where(eq(schema.employees.id, employeeId))
    .limit(1);
  const emp = empRows[0];
  const nmbrsId = emp?.nmbrsEmployeeId;

  if (!nmbrsId) return null;

  try {
    return await getPayslipPdfBase64(nmbrsId, year, period);
  } catch (e) {
    if (e instanceof NmbrsError) {
      return null;
    }
    throw e;
  }
}
