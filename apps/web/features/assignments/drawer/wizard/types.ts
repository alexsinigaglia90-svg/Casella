import type { CompensationType } from "@casella/types";

/**
 * Form-state for the assignment wizard (create + edit). All fields stored as
 * strings so empty inputs round-trip cleanly; mapping helpers convert to the
 * Zod-schema shape (string|null, number|null, enum|null) at submit-time.
 */
export interface CreateAssignmentFormValues {
  // Step 1 — Toewijzing
  projectId: string;
  employeeId: string;
  startDate: string; // ISO date YYYY-MM-DD or "" for empty
  endDate: string;
  // Step 2 — Vergoeding overrides
  // "" = follow employee default; otherwise one of the enum values.
  compensationType: CompensationType | "";
  kmRateCents: string; // numeric string or "" for "use employee default"
}

export function emptyAssignmentForm(): CreateAssignmentFormValues {
  return {
    projectId: "",
    employeeId: "",
    startDate: "",
    endDate: "",
    compensationType: "",
    kmRateCents: "",
  };
}

export const ASSIGNMENT_STEPS = [
  {
    key: "toewijzing",
    label: "Toewijzing",
    kicker: "Stap 1",
    title: "Wie werkt op welk project?",
    sub: "Koppel een medewerker aan een project en bepaal de looptijd.",
  },
  {
    key: "vergoeding",
    label: "Vergoeding",
    kicker: "Stap 2",
    title: "Vergoeding & check",
    sub: "Optionele overrides. Laat leeg om de medewerker-defaults te volgen.",
  },
] as const;
