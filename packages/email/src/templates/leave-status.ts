import { skeletonEmail, type SkeletonOutput } from "./_skeleton";

export interface LeaveSubmittedAdminInput {
  to: string;
  recipientName: string;
  appUrl: string;
  employeeName: string;
  leaveTypeLabel: string;
  startDate: string;
  endDate?: string | null;
  hours: number;
}

export function leaveSubmittedAdminEmail(
  input: LeaveSubmittedAdminInput,
): SkeletonOutput {
  const range = input.endDate
    ? `${input.startDate} t/m ${input.endDate}`
    : input.startDate;
  const body = `${input.employeeName} heeft een verlofaanvraag ingediend: <strong>${input.leaveTypeLabel}</strong> (${range}, ${input.hours} uur). Beoordeel de aanvraag in het admin-panel.`;
  return skeletonEmail(
    `Verlofaanvraag van ${input.employeeName}`,
    body,
    "Beoordeel aanvraag",
    {
      to: input.to,
      recipientName: input.recipientName,
      appUrl: input.appUrl,
      ctaPath: "/admin/verlof",
    },
  );
}

export interface LeaveDecidedEmployeeInput {
  to: string;
  recipientName: string;
  appUrl: string;
  decision: "goedgekeurd" | "afgewezen";
  leaveTypeLabel: string;
  startDate: string;
  endDate?: string | null;
  hours: number;
  reason?: string | null;
}

export function leaveDecidedEmployeeEmail(
  input: LeaveDecidedEmployeeInput,
): SkeletonOutput {
  const range = input.endDate
    ? `${input.startDate} t/m ${input.endDate}`
    : input.startDate;
  const lines: string[] = [
    `Je verlofaanvraag <strong>${input.leaveTypeLabel}</strong> (${range}, ${input.hours} uur) is <strong>${input.decision}</strong>.`,
  ];
  if (input.decision === "afgewezen" && input.reason) {
    lines.push(`Reden: ${input.reason}`);
  }
  return skeletonEmail(
    `Verlof ${input.decision}: ${input.leaveTypeLabel}`,
    lines.join("<br/><br/>"),
    "Bekijk verlofoverzicht",
    {
      to: input.to,
      recipientName: input.recipientName,
      appUrl: input.appUrl,
      ctaPath: "/verlof",
    },
  );
}
