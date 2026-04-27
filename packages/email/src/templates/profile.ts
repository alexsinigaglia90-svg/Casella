import { skeletonEmail, type SkeletonInput } from "./_skeleton";

export function changeRequestSubmittedAdminEmail(
  input: SkeletonInput & { employeeName: string; type: "address" | "iban" },
) {
  return skeletonEmail(
    `Wijzigingsverzoek: ${input.employeeName}`,
    `${input.employeeName} heeft een wijzigingsverzoek voor ${input.type === "address" ? "adres" : "IBAN"} ingediend.`,
    "Bekijk in admin",
    input,
  );
}

export function changeRequestDecidedEmployeeEmail(
  input: SkeletonInput & {
    decision: "goedgekeurd" | "afgewezen";
    type: "address" | "iban";
    reason?: string;
  },
) {
  return skeletonEmail(
    `Je ${input.type === "address" ? "adres" : "IBAN"}-wijziging is ${input.decision}`,
    input.decision === "goedgekeurd"
      ? `Je wijziging is doorgevoerd in Casella.`
      : `Je verzoek is afgewezen. Reden: ${input.reason ?? "geen toelichting"}.`,
    "Bekijk in Casella",
    input,
  );
}
