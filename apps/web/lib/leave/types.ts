export const LEAVE_TYPE_KEYS = [
  "vacation_legal",
  "vacation_extra",
  "pregnancy",
  "maternity",
  "birth_partner",
  "additional_birth",
  "adoption",
  "parental_paid",
  "parental_unpaid",
  "short_care",
  "long_care",
  "calamity",
  "special",
  "unpaid",
] as const;

export type LeaveTypeKey = (typeof LEAVE_TYPE_KEYS)[number];

export type LeaveApprovalMode = "self" | "admin";

export interface LeaveCustomFieldDef {
  key: string;
  label: string;
  type: "date" | "text" | "number";
  required?: boolean;
}

export interface LeaveTypeConfig {
  key: LeaveTypeKey;
  label: string;
  description: string;
  approvalMode: LeaveApprovalMode;
  hasBalance: boolean;
  attachmentRequired: boolean;
  customFields: LeaveCustomFieldDef[];
}

export const LEAVE_TYPES: Record<LeaveTypeKey, LeaveTypeConfig> = {
  vacation_legal: {
    key: "vacation_legal",
    label: "Wettelijke vakantie",
    description:
      "Wettelijke vakantiedagen (art. 7:634 BW). 4× contracturen per jaar. Vervalt 6 maanden na het kalenderjaar tenzij verlengd.",
    approvalMode: "admin",
    hasBalance: true,
    attachmentRequired: false,
    customFields: [],
  },
  vacation_extra: {
    key: "vacation_extra",
    label: "Bovenwettelijke vakantie",
    description:
      "Extra vakantiedagen boven de wettelijke (cao/contract). Verjaringstermijn 5 jaar.",
    approvalMode: "admin",
    hasBalance: true,
    attachmentRequired: false,
    customFields: [],
  },
  pregnancy: {
    key: "pregnancy",
    label: "Zwangerschapsverlof",
    description:
      "Wet arbeid en zorg (Wazo). Start 4–6 weken voor uitgerekende datum. Volledig betaald via UWV.",
    approvalMode: "self",
    hasBalance: false,
    attachmentRequired: true,
    customFields: [
      {
        key: "expectedBirthDate",
        label: "Uitgerekende datum",
        type: "date",
        required: true,
      },
    ],
  },
  maternity: {
    key: "maternity",
    label: "Bevallingsverlof",
    description:
      "Wazo. Minimaal 10 weken na bevalling, samen met zwangerschapsverlof totaal 16 weken. Volledig betaald via UWV.",
    approvalMode: "self",
    hasBalance: false,
    attachmentRequired: true,
    customFields: [
      {
        key: "actualBirthDate",
        label: "Geboortedatum",
        type: "date",
        required: true,
      },
    ],
  },
  birth_partner: {
    key: "birth_partner",
    label: "Geboorteverlof partner",
    description:
      "Wazo. 1 werkweek volledig betaald binnen 4 weken na geboorte. Werkgever betaalt 100%.",
    approvalMode: "self",
    hasBalance: false,
    attachmentRequired: false,
    customFields: [
      {
        key: "birthDate",
        label: "Geboortedatum kind",
        type: "date",
        required: true,
      },
    ],
  },
  additional_birth: {
    key: "additional_birth",
    label: "Aanvullend geboorteverlof",
    description:
      "Wazo. Tot 5 werkweken in de eerste 6 maanden, 70% loon via UWV-uitkering.",
    approvalMode: "admin",
    hasBalance: false,
    attachmentRequired: false,
    customFields: [
      {
        key: "birthDate",
        label: "Geboortedatum kind",
        type: "date",
        required: true,
      },
    ],
  },
  adoption: {
    key: "adoption",
    label: "Adoptie- of pleegzorgverlof",
    description:
      "Wazo. 6 weken volledig betaald via UWV bij adoptie of opname pleegkind.",
    approvalMode: "self",
    hasBalance: false,
    attachmentRequired: true,
    customFields: [
      {
        key: "placementDate",
        label: "Datum opname",
        type: "date",
        required: true,
      },
    ],
  },
  parental_paid: {
    key: "parental_paid",
    label: "Betaald ouderschapsverlof",
    description:
      "Wazo. Eerste 9 weken 70% loon via UWV, op te nemen in eerste levensjaar.",
    approvalMode: "admin",
    hasBalance: true,
    attachmentRequired: false,
    customFields: [],
  },
  parental_unpaid: {
    key: "parental_unpaid",
    label: "Onbetaald ouderschapsverlof",
    description:
      "Wazo. Tot 17 weken onbetaald, op te nemen tot kind 8 jaar wordt.",
    approvalMode: "admin",
    hasBalance: true,
    attachmentRequired: false,
    customFields: [],
  },
  short_care: {
    key: "short_care",
    label: "Kortdurend zorgverlof",
    description:
      "Wazo. 2× contracturen per jaar voor noodzakelijke zorg aan zieke naaste. 70% loon doorbetaald.",
    approvalMode: "self",
    hasBalance: true,
    attachmentRequired: false,
    customFields: [],
  },
  long_care: {
    key: "long_care",
    label: "Langdurend zorgverlof",
    description:
      "Wazo. 6× contracturen per 12 maanden voor langdurig zieke naaste. Onbetaald.",
    approvalMode: "admin",
    hasBalance: true,
    attachmentRequired: false,
    customFields: [],
  },
  calamity: {
    key: "calamity",
    label: "Calamiteiten- en kort verzuimverlof",
    description:
      "Wazo. Korte tijd doorbetaald verlof bij plotseling onvoorziene gebeurtenissen.",
    approvalMode: "self",
    hasBalance: false,
    attachmentRequired: false,
    customFields: [],
  },
  special: {
    key: "special",
    label: "Bijzonder verlof",
    description:
      "Bijzonder verlof volgens cao of arbeidsovereenkomst (huwelijk, begrafenis, e.d.).",
    approvalMode: "admin",
    hasBalance: false,
    attachmentRequired: false,
    customFields: [],
  },
  unpaid: {
    key: "unpaid",
    label: "Onbetaald verlof",
    description:
      "Onbetaald verlof in overleg met werkgever. Geen wettelijk recht — afhankelijk van goedkeuring.",
    approvalMode: "admin",
    hasBalance: false,
    attachmentRequired: false,
    customFields: [],
  },
};

export const SELF_APPROVE_TYPES: LeaveTypeKey[] = (
  Object.values(LEAVE_TYPES)
    .filter((t) => t.approvalMode === "self")
    .map((t) => t.key)
);

export const ADMIN_APPROVE_TYPES: LeaveTypeKey[] = (
  Object.values(LEAVE_TYPES)
    .filter((t) => t.approvalMode === "admin")
    .map((t) => t.key)
);

export function isLeaveTypeKey(value: string): value is LeaveTypeKey {
  return (LEAVE_TYPE_KEYS as readonly string[]).includes(value);
}
