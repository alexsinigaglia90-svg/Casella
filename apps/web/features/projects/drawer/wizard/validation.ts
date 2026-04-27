import type { CreateProjectFormValues } from "./types";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateProjectStep(
  step: number,
  f: CreateProjectFormValues,
): Record<string, string> {
  const errs: Record<string, string> = {};

  if (step === 0) {
    if (!f.clientId) errs.clientId = "Kies bij welke klant dit project hoort.";
    if (!f.name.trim()) errs.name = "Hoe heet het project?";
  }

  if (step === 1) {
    if (f.startDate && !ISO_DATE_RE.test(f.startDate)) {
      errs.startDate = "Datum moet JJJJ-MM-DD zijn.";
    }
    if (f.endDate && !ISO_DATE_RE.test(f.endDate)) {
      errs.endDate = "Datum moet JJJJ-MM-DD zijn.";
    }
    if (
      f.startDate &&
      f.endDate &&
      ISO_DATE_RE.test(f.startDate) &&
      ISO_DATE_RE.test(f.endDate) &&
      f.endDate < f.startDate
    ) {
      errs.endDate = "Einddatum moet na startdatum liggen.";
    }
  }

  return errs;
}

export function isProjectStepValid(
  step: number,
  f: CreateProjectFormValues,
): boolean {
  return Object.keys(validateProjectStep(step, f)).length === 0;
}
