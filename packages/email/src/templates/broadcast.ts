import { skeletonEmail, type SkeletonInput } from "./_skeleton";

export function broadcastEmployeeEmail(input: SkeletonInput & { message: string }) {
  return skeletonEmail(
    `Nieuw bericht van Ascentra`,
    input.message,
    "Bekijk in Casella",
    input,
  );
}
