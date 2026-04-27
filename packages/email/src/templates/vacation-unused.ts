import { skeletonEmail, type SkeletonInput, type SkeletonOutput } from "./_skeleton";

export interface VacationUnusedInput extends SkeletonInput {
  hoursRemaining: number;
  year: number;
}

export function vacationUnusedYearEndEmployeeEmail(
  input: VacationUnusedInput,
): SkeletonOutput {
  return skeletonEmail(
    `Nog ${input.hoursRemaining}u vakantie-saldo voor ${input.year}`,
    `Je hebt aan het einde van ${input.year} nog ${input.hoursRemaining} uur vakantie-saldo. Wettelijke saldi vervallen op 1 juli volgend jaar.`,
    "Bekijk saldo",
    input,
  );
}
