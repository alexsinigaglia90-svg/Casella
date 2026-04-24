import type { PdokAddress } from "@casella/maps";

export type CompensationType = "auto" | "ov" | "none";

export interface CreateEmployeeFormValues {
  // Step 1 — Wie
  firstName: string;
  lastName: string;
  inviteEmail: string;
  phone: string;
  jobTitle: string;
  // Step 2 — Werk
  startDate: string; // YYYY-MM-DD
  contractedHours: number; // mapped to contractedHoursPerWeek on submit
  manager: string; // dummy local-only (1.1b)
  // Step 3 — Reis
  compensationType: CompensationType;
  kmRateCents: number; // mapped to defaultKmRateCents on submit
  address: PdokAddress | null;
  emergencyName: string; // mapped to emergencyContactName on submit
  emergencyPhone: string;
  notes: string;
}

export function emptyForm(): CreateEmployeeFormValues {
  return {
    firstName: "",
    lastName: "",
    inviteEmail: "",
    phone: "",
    jobTitle: "",
    startDate: "",
    contractedHours: 40,
    manager: "",
    compensationType: "auto",
    kmRateCents: 23,
    address: null,
    emergencyName: "",
    emergencyPhone: "",
    notes: "",
  };
}

export const STEPS = [
  {
    key: "wie",
    label: "Wie",
    kicker: "Stap 1",
    title: "Wie voeg je toe?",
    sub: "Eerst even de basis — we maken een uitnodiging.",
  },
  {
    key: "dienst",
    label: "Werk",
    kicker: "Stap 2",
    title: "Hoe werken ze bij ons?",
    sub: "Wanneer beginnen ze, en wat staat er in het contract?",
  },
  {
    key: "vergoeding",
    label: "Reis",
    kicker: "Stap 3",
    title: "Reizen & wonen",
    sub: "Voor km-declaraties en contactgegevens.",
  },
  {
    key: "uitnodigen",
    label: "Stuur",
    kicker: "Stap 4",
    title: "Klaar om te versturen",
    sub: "Controleer, en laat Casella de rest doen.",
  },
] as const;
