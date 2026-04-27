import { skeletonEmail, type SkeletonInput } from "./_skeleton";

export function contractUploadedEmployeeEmail(input: SkeletonInput) {
  return skeletonEmail(
    "Nieuw contract beschikbaar",
    "Je nieuwe contract is geüpload door je werkgever. Bekijk de details en download in Casella.",
    "Bekijk in Casella",
    input,
  );
}
