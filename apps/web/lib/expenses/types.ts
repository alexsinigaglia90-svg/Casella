export const EXPENSE_CATEGORIES = [
  { key: "travel", label: "Reiskosten", customFields: ["fromTo"] },
  { key: "client_meal", label: "Maaltijd met klant", customFields: ["personCount", "clientName"] },
  { key: "conference", label: "Conferentie/training", customFields: ["eventName"] },
  { key: "materials", label: "Materiaal/boeken", customFields: ["description"] },
  { key: "software", label: "Software/abonnement", customFields: ["toolName", "subscriptionPeriod"] },
  { key: "telecom", label: "Telefoon/internet", customFields: ["provider"] },
  { key: "client_gift", label: "Klant-cadeau", customFields: ["clientName", "giftDescription"] },
  { key: "other", label: "Anders", customFields: ["extendedDescription"] },
] as const;

export type ExpenseCategoryKey = (typeof EXPENSE_CATEGORIES)[number]["key"];

export const EXPENSE_CATEGORY_MAP = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.key, c]),
) as Record<ExpenseCategoryKey, (typeof EXPENSE_CATEGORIES)[number]>;
