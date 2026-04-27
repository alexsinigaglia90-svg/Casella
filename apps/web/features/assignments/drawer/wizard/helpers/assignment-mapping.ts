import type {
  AssignmentEnriched,
  CompensationType,
  UpdateAssignmentInput,
} from "@casella/types";

import type { CreateAssignmentFormValues } from "../types";

/**
 * Seed a CreateAssignmentFormValues from a fetched AssignmentEnriched.
 * Used by the wizard in edit-mode as the initial form state.
 */
export function assignmentToForm(
  a: AssignmentEnriched,
): CreateAssignmentFormValues {
  return {
    projectId: a.projectId,
    employeeId: a.employeeId,
    startDate: a.startDate ?? "",
    endDate: a.endDate ?? "",
    compensationType: (a.compensationType ?? "") as CompensationType | "",
    kmRateCents:
      a.kmRateCents === null || a.kmRateCents === undefined
        ? ""
        : String(a.kmRateCents),
  };
}

/**
 * Compute a sparse PATCH payload by deep-comparing initial vs. current form
 * values. Returns Omit<UpdateAssignmentInput, "id"> — the route handler injects
 * the id from the URL.
 */
export function diffAssignmentForm(
  initial: CreateAssignmentFormValues,
  current: CreateAssignmentFormValues,
): Omit<Partial<UpdateAssignmentInput>, "id"> {
  const dirty: Omit<Partial<UpdateAssignmentInput>, "id"> = {};

  if (initial.projectId !== current.projectId) {
    dirty.projectId = current.projectId;
  }
  if (initial.employeeId !== current.employeeId) {
    dirty.employeeId = current.employeeId;
  }
  if (initial.startDate !== current.startDate) {
    dirty.startDate = current.startDate || null;
  }
  if (initial.endDate !== current.endDate) {
    dirty.endDate = current.endDate || null;
  }
  if (initial.compensationType !== current.compensationType) {
    dirty.compensationType = current.compensationType
      ? (current.compensationType as CompensationType)
      : null;
  }
  if (initial.kmRateCents !== current.kmRateCents) {
    dirty.kmRateCents =
      current.kmRateCents === "" ? null : Number(current.kmRateCents);
  }

  return dirty;
}

/**
 * Map a compensationType to a human-readable Dutch label for UI surfaces.
 */
export const COMPENSATION_TYPE_LABELS: Record<CompensationType, string> = {
  auto: "Auto",
  ov: "OV",
  none: "Geen",
};

export function compensationLabel(value: CompensationType | null): string {
  if (value === null) return "Volg medewerker";
  return COMPENSATION_TYPE_LABELS[value];
}

export function kmRateLabel(value: number | null): string {
  if (value === null || value === undefined) return "Standaard medewerker";
  return `${(value / 100).toFixed(2)} €/km`;
}
