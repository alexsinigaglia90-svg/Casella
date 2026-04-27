import { escapeXml, soapCall } from "./client";

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
