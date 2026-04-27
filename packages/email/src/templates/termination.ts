import { skeletonEmail, type SkeletonInput, type SkeletonOutput } from "./_skeleton";

export interface TerminationUpcomingAdminInput extends SkeletonInput {
  employeeName: string;
  effectiveDate: string;
}

export function terminationUpcomingAdminEmail(
  input: TerminationUpcomingAdminInput,
): SkeletonOutput {
  return skeletonEmail(
    `Uitdiensttreding over 7 dagen: ${input.employeeName}`,
    `${input.employeeName} treedt uit dienst op ${input.effectiveDate}. Controleer eindafrekening en offboarding.`,
    "Bekijk medewerker",
    input,
  );
}
