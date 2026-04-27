import { escapeXml, soapCall } from "./client";

export interface PushHoursPayload {
  nmbrsEmployeeId: string;
  year: number;
  weekOrPeriod: number;
  hours: number;
  /** Hour-component code id (depends on Nmbrs config; 1 = regular hours by default). */
  hourCodeId: number;
}

export async function pushHourComponentInsert(
  payload: PushHoursPayload,
): Promise<{ inserted: true }> {
  const action = "HourComponentVar_Insert";
  const body = `<nmbrs:${action} xmlns:nmbrs="https://api.nmbrs.nl/soap/v3/EmployeeService">
    <nmbrs:EmployeeId>${escapeXml(payload.nmbrsEmployeeId)}</nmbrs:EmployeeId>
    <nmbrs:Year>${payload.year}</nmbrs:Year>
    <nmbrs:Period>${payload.weekOrPeriod}</nmbrs:Period>
    <nmbrs:HourComponent>
      <nmbrs:Id>${payload.hourCodeId}</nmbrs:Id>
      <nmbrs:Hours>${payload.hours}</nmbrs:Hours>
    </nmbrs:HourComponent>
  </nmbrs:${action}>`;

  await soapCall({ service: "Hours", action, body });
  return { inserted: true };
}
