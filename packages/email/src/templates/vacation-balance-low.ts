import { skeletonEmail, type SkeletonInput, type SkeletonOutput } from "./_skeleton";

export interface VacationBalanceLowInput extends SkeletonInput {
  hoursRemaining: number;
}

export function vacationBalanceLowEmployeeEmail(
  input: VacationBalanceLowInput,
): SkeletonOutput {
  return skeletonEmail(
    `Je vakantie-saldo is laag (${input.hoursRemaining}u over)`,
    `Je hebt nog ${input.hoursRemaining} uur vakantie-saldo over dit jaar. Plan tijdig je verlof.`,
    "Bekijk saldo",
    input,
  );
}
