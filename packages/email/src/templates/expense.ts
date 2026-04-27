import { skeletonEmail, type SkeletonInput } from "./_skeleton";

export function expenseSubmittedAdminEmail(
  input: SkeletonInput & {
    employeeName: string;
    categoryLabel: string;
    amountEur: string;
  },
) {
  return skeletonEmail(
    `Nieuwe declaratie: ${input.employeeName}`,
    `${input.employeeName} heeft een ${input.categoryLabel}-declaratie van ${input.amountEur} ingediend.`,
    "Bekijk in admin",
    input,
  );
}

export function expenseDecidedEmployeeEmail(
  input: SkeletonInput & {
    decision: "goedgekeurd" | "afgewezen";
    categoryLabel: string;
    reason?: string;
  },
) {
  return skeletonEmail(
    `Je declaratie is ${input.decision}`,
    input.decision === "goedgekeurd"
      ? `Je ${input.categoryLabel}-declaratie is goedgekeurd en wordt verwerkt.`
      : `Je ${input.categoryLabel}-declaratie is afgewezen. Reden: ${input.reason ?? "geen toelichting"}.`,
    "Bekijk in Casella",
    input,
  );
}
