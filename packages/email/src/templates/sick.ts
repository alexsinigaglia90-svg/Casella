import { skeletonEmail, type SkeletonOutput } from "./_skeleton";

export interface SickSubmittedAdminInput {
  to: string;
  recipientName: string;
  appUrl: string;
  employeeName: string;
  startDate: string;
  expectedDays?: number | null;
}

export function sickSubmittedAdminEmail(
  input: SickSubmittedAdminInput,
): SkeletonOutput {
  const lines: string[] = [
    `${input.employeeName} heeft zich ziek gemeld per <strong>${input.startDate}</strong>.`,
  ];
  if (input.expectedDays && input.expectedDays > 0) {
    lines.push(`Verwachte duur: ${input.expectedDays} dag(en).`);
  }
  lines.push(
    "Conform AVG bevat deze melding geen medische details. Bekijk het verzuim-overzicht voor meer info.",
  );
  return skeletonEmail(
    `Ziekmelding van ${input.employeeName}`,
    lines.join("<br/><br/>"),
    "Bekijk verzuim-overzicht",
    {
      to: input.to,
      recipientName: input.recipientName,
      appUrl: input.appUrl,
      ctaPath: "/admin/verzuim",
    },
  );
}
