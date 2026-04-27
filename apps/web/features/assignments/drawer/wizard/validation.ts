import type { CreateAssignmentFormValues } from "./types";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function validateAssignmentStep(
  step: number,
  f: CreateAssignmentFormValues,
): Record<string, string> {
  const errs: Record<string, string> = {};

  if (step === 0) {
    if (!f.projectId) errs.projectId = "Kies bij welk project de toewijzing hoort.";
    if (!f.employeeId) errs.employeeId = "Kies welke medewerker je toewijst.";

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

  if (step === 1) {
    if (f.kmRateCents !== "") {
      const n = Number(f.kmRateCents);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
        errs.kmRateCents = "Vul een heel getal in cents in (≥ 0).";
      }
    }
  }

  return errs;
}

export function isAssignmentStepValid(
  step: number,
  f: CreateAssignmentFormValues,
): boolean {
  return Object.keys(validateAssignmentStep(step, f)).length === 0;
}
