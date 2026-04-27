import { skeletonEmail, type SkeletonInput, type SkeletonOutput } from "./_skeleton";

export interface PayslipAvailableInput extends SkeletonInput {
  periodLabel: string;
}

export function payslipAvailableEmployeeEmail(
  input: PayslipAvailableInput,
): SkeletonOutput {
  return skeletonEmail(
    `Je loonstrook voor ${input.periodLabel} staat klaar`,
    `De loonstrook voor ${input.periodLabel} is beschikbaar in Casella en bij Nmbrs.`,
    "Bekijk loonstrook",
    input,
  );
}
