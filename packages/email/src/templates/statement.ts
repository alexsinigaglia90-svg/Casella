import { skeletonEmail, type SkeletonInput } from "./_skeleton";

export function statementReadyEmployeeEmail(input: SkeletonInput) {
  return skeletonEmail(
    "Werkgeversverklaring beschikbaar",
    "Je werkgeversverklaring is klaar. Download via Casella.",
    "Bekijk in Casella",
    input,
  );
}
