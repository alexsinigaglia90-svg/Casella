import { escapeXml, soapCall } from "./client";
import { NmbrsError } from "./errors";

export type NmbrsLeaveType = "vacation" | "sick" | "special";

export interface PushLeavePayload {
  nmbrsEmployeeId: string;
  /** ISO date YYYY-MM-DD */
  startDate: string;
  /** ISO date YYYY-MM-DD */
  endDate: string;
  hours: number;
  leaveType: NmbrsLeaveType;
}

function leaveTypeId(t: NmbrsLeaveType): number {
  switch (t) {
    case "sick":
      return 2;
    case "special":
      return 3;
    case "vacation":
    default:
      return 1;
  }
}

export async function pushLeaveRequest(
  payload: PushLeavePayload,
): Promise<{ inserted: true }> {
  const action = "Leave_Insert";
  const body = `<nmbrs:${action} xmlns:nmbrs="https://api.nmbrs.nl/soap/v3/EmployeeService">
    <nmbrs:EmployeeId>${escapeXml(payload.nmbrsEmployeeId)}</nmbrs:EmployeeId>
    <nmbrs:Leave>
      <nmbrs:Start>${escapeXml(payload.startDate)}</nmbrs:Start>
      <nmbrs:End>${escapeXml(payload.endDate)}</nmbrs:End>
      <nmbrs:LeaveTypeId>${leaveTypeId(payload.leaveType)}</nmbrs:LeaveTypeId>
      <nmbrs:Hours>${payload.hours}</nmbrs:Hours>
    </nmbrs:Leave>
  </nmbrs:${action}>`;

  await soapCall({ service: "Employee", action, body });
  return { inserted: true };
}

export interface LeaveBalanceItem {
  leaveType: string;
  hoursTotal: number;
  hoursRemaining: number;
  expiresAt?: string;
}

/**
 * Fetch leave balances for an employee for a given year from Nmbrs.
 * SOAP method stubbed — throws NmbrsError("not_implemented") until
 * the exact Nmbrs LeaveBalance WSDL method is confirmed.
 * Graceful: callers should catch not_implemented and missing_credentials.
 */
export async function getLeaveBalancesByYear(
  nmbrsEmployeeId: string,
  year: number,
): Promise<LeaveBalanceItem[]> {
  // Validate credentials first so missing_credentials is thrown before
  // attempting the network call.
  const action = "LeaveBalance_GetByYear";
  const body = `<nmbrs:${action} xmlns:nmbrs="https://api.nmbrs.nl/soap/v3/EmployeeService">
    <nmbrs:EmployeeId>${escapeXml(nmbrsEmployeeId)}</nmbrs:EmployeeId>
    <nmbrs:Year>${year}</nmbrs:Year>
  </nmbrs:${action}>`;

  let raw: Record<string, unknown>;
  try {
    raw = await soapCall<Record<string, unknown>>({ service: "Employee", action, body });
  } catch (e) {
    // Surface missing_credentials / auth_failed as-is; wrap unknown SOAP faults
    // as not_implemented so callers can skip gracefully.
    if (e instanceof NmbrsError) throw e;
    throw new NmbrsError("not_implemented", "LeaveBalance_GetByYear niet beschikbaar", e);
  }

  // Parse response shape — adjust key path once WSDL is confirmed.
  const response = (raw as Record<string, unknown>)[`${action}Response`];
  const result = (response as Record<string, unknown> | undefined)?.[`${action}Result`];
  if (!result) {
    throw new NmbrsError("not_implemented", "LeaveBalance_GetByYear lege response");
  }

  const items = Array.isArray(result) ? result : [result];
  return items.map((item) => {
    const i = item as Record<string, unknown>;
    return {
      leaveType: String(i.LeaveTypeName ?? i.leaveType ?? "unknown"),
      hoursTotal: parseFloat(String(i.HoursTotal ?? i.hoursTotal ?? "0")),
      hoursRemaining: parseFloat(String(i.HoursRemaining ?? i.hoursRemaining ?? "0")),
      expiresAt: i.ExpiresAt ? String(i.ExpiresAt) : undefined,
    };
  });
}
