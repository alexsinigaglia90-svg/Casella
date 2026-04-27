import type { ProjectStatus } from "@casella/types";

export interface CreateProjectFormValues {
  // Step 1 — Basis
  clientId: string;
  name: string;
  description: string;
  // Step 2 — Periode
  startDate: string; // ISO date YYYY-MM-DD or "" for empty
  endDate: string;
  status: ProjectStatus;
}

export function emptyProjectForm(): CreateProjectFormValues {
  return {
    clientId: "",
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "planned",
  };
}

export const PROJECT_STEPS = [
  {
    key: "basis",
    label: "Basis",
    kicker: "Stap 1",
    title: "Welke project voeg je toe?",
    sub: "Klant, naam en eventueel een korte omschrijving.",
  },
  {
    key: "periode",
    label: "Periode",
    kicker: "Stap 2",
    title: "Wanneer loopt het?",
    sub: "Looptijd en huidige status.",
  },
  {
    key: "check",
    label: "Check",
    kicker: "Stap 3",
    title: "Klaar om op te slaan",
    sub: "Controleer voor je het opslaat.",
  },
] as const;
