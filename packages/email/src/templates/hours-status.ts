import { skeletonEmail, type SkeletonInput, type SkeletonOutput } from "./_skeleton";

export interface HoursDecidedEmployeeInput extends SkeletonInput {
  decision: "goedgekeurd" | "afgewezen";
  weekLabel: string;
  reason?: string;
}

export function hoursDecidedEmployeeEmail(
  input: HoursDecidedEmployeeInput,
): SkeletonOutput {
  return skeletonEmail(
    `Je uren voor ${input.weekLabel} zijn ${input.decision}`,
    input.decision === "goedgekeurd"
      ? `Je uren-registratie voor ${input.weekLabel} is goedgekeurd.`
      : `Je uren-registratie voor ${input.weekLabel} is afgewezen. Reden: ${input.reason ?? "geen toelichting"}.`,
    "Bekijk in Casella",
    input,
  );
}
