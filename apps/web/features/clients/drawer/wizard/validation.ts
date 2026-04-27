import type { CreateClientFormValues } from "./types";

export function validateClientStep(
  step: number,
  f: CreateClientFormValues,
): Record<string, string> {
  const errs: Record<string, string> = {};

  if (step === 0) {
    if (!f.name.trim()) errs.name = "Hoe heet de klant?";
    if (f.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contactEmail)) {
      errs.contactEmail = "Dit e-mailadres ziet er nog niet compleet uit.";
    }
  }

  if (step === 1) {
    if (!f.address) {
      errs.address = "We hebben een vestigingsadres nodig.";
    }
  }

  return errs;
}

export function isClientStepValid(
  step: number,
  f: CreateClientFormValues,
): boolean {
  return Object.keys(validateClientStep(step, f)).length === 0;
}
