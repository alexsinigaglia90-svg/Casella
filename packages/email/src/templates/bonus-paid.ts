import { skeletonEmail, type SkeletonInput, type SkeletonOutput } from "./_skeleton";

export interface BonusPaidEmployeeInput extends SkeletonInput {
  amountEur: string;
  period: string;
}

export function bonusPaidEmployeeEmail(
  input: BonusPaidEmployeeInput,
): SkeletonOutput {
  return skeletonEmail(
    `Bonus uitbetaald: ${input.amountEur}`,
    `Je bonus voor ${input.period} (${input.amountEur}) is verwerkt en wordt met je salaris uitbetaald.`,
    "Bekijk bonus",
    input,
  );
}
