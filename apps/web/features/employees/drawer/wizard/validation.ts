import type { CreateEmployeeFormValues } from "./types";

export function validateStep(
  step: number,
  f: CreateEmployeeFormValues,
): Record<string, string> {
  const errs: Record<string, string> = {};

  if (step === 0) {
    if (!f.firstName.trim()) errs.firstName = "Hoe heet je nieuwe collega?";
    if (!f.lastName.trim()) errs.lastName = "En de achternaam?";
    if (!f.inviteEmail.trim())
      errs.inviteEmail = "Een e-mail is nodig om de uitnodiging te sturen.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.inviteEmail))
      errs.inviteEmail = "Dit e-mailadres ziet er nog niet compleet uit.";
    if (!f.phone.trim()) errs.phone = "Handig voor calamiteiten.";
    if (!f.jobTitle.trim()) errs.jobTitle = "Welke functie krijgen ze?";
  }

  if (step === 1) {
    if (!f.startDate) errs.startDate = "Wanneer beginnen ze?";
    if (!f.contractedHours || f.contractedHours < 1 || f.contractedHours > 60)
      errs.contractedHours = "Kies tussen 1 en 60 uur.";
  }

  if (step === 2) {
    if (!f.compensationType) errs.compensationType = "Kies een vergoedingsvorm.";
    if (!f.address)
      errs.address = "We hebben een woonadres nodig voor km-declaraties.";
    if (!f.emergencyName.trim()) errs.emergencyName = "Wie bel je in een noodgeval?";
  }

  return errs;
}

export function isStepValid(
  step: number,
  f: CreateEmployeeFormValues,
): boolean {
  return Object.keys(validateStep(step, f)).length === 0;
}
