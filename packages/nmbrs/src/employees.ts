import { z } from "zod";

import { escapeXml, getCredentialsFromEnv, soapCall } from "./client";
import { NmbrsError } from "./errors";

// ---------------------------------------------------------------------------
// Payslip API surface
// SOAP implementation is stubbed — NmbrsError('not_implemented') until prod
// Nmbrs-credentials are available. See NMBRS-PAYSLIP-SOAP-IMPL in deferred-work.
// ---------------------------------------------------------------------------

export interface NmbrsPayslipSummary {
  year: number;
  period: number;
  amountGrossCents: number;
  availableSince: string;
}

export async function getEmployeePayslips(
  nmbrsEmployeeId: string,
  year: number,
): Promise<NmbrsPayslipSummary[]> {
  const creds = getCredentialsFromEnv(); // throws missing_credentials if not set
  // TODO: NMBRS-PAYSLIP-SOAP-IMPL — implement SOAP call to EmployeeService_GetPayslip
  // when prod-creds are available. Shape of SOAP body TBD via Nmbrs API docs.
  void creds;
  void nmbrsEmployeeId;
  void year;
  throw new NmbrsError(
    "not_implemented",
    "getEmployeePayslips is not yet implemented — SOAP method EmployeeService_GetPayslip needs wiring",
  );
}

export async function getPayslipPdfBase64(
  nmbrsEmployeeId: string,
  year: number,
  period: number,
): Promise<string> {
  const creds = getCredentialsFromEnv(); // throws missing_credentials if not set
  // TODO: NMBRS-PAYSLIP-SOAP-IMPL — implement SOAP call to retrieve payslip PDF
  void creds;
  void nmbrsEmployeeId;
  void year;
  void period;
  throw new NmbrsError(
    "not_implemented",
    "getPayslipPdfBase64 is not yet implemented — SOAP method needs wiring",
  );
}

const employeeBaseSchema = z.object({
  Id: z.union([z.number(), z.string()]),
  Number: z.union([z.number(), z.string()]).optional(),
  DisplayName: z.string().optional(),
  EmployeeType: z.union([z.number(), z.string()]).optional(),
});

export interface NmbrsEmployee {
  nmbrsId: string;
  number: string | null;
  displayName: string | null;
  employeeType: string | null;
}

interface ListEmployeesResponseShape {
  [k: string]: unknown;
}

export async function listEmployeesByCompany(): Promise<NmbrsEmployee[]> {
  const creds = getCredentialsFromEnv();
  const action = "Employee_GetAll_AllEmployeesByCompany";
  const body = `<nmbrs:${action} xmlns:nmbrs="https://api.nmbrs.nl/soap/v3/EmployeeService">
    <nmbrs:CompanyId>${escapeXml(String(creds.companyId))}</nmbrs:CompanyId>
    <nmbrs:EmployeeType>1</nmbrs:EmployeeType>
  </nmbrs:${action}>`;

  const res = await soapCall<ListEmployeesResponseShape>({
    service: "Employee",
    action,
    body,
    creds,
  });

  const wrapped = res[`${action}Response`] as
    | Record<string, unknown>
    | undefined;
  if (!wrapped) {
    throw new NmbrsError("invalid_response", "Geen Response wrapper");
  }
  const result = wrapped[`${action}Result`] as
    | { Employee?: unknown }
    | undefined;
  if (!result) return [];

  const raw = result.Employee;
  const list: unknown[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

  const employees: NmbrsEmployee[] = [];
  for (const item of list) {
    const parsed = employeeBaseSchema.safeParse(item);
    if (!parsed.success) continue;
    const r = parsed.data;
    employees.push({
      nmbrsId: String(r.Id),
      number: r.Number !== undefined ? String(r.Number) : null,
      displayName: r.DisplayName ?? null,
      employeeType: r.EmployeeType !== undefined ? String(r.EmployeeType) : null,
    });
  }
  return employees;
}
