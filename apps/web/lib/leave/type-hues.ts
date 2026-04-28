import type { LeaveTypeKey } from "./types";

/**
 * OKLCH-hues per leave type, voor consistente kleuring in UI (balance-bars,
 * pills, badges). Mapping volgt Casella domain-hues — sun (50) voor vakantie,
 * harvest (145) voor ouderschap, cool (240) voor calamiteit, spark (280) voor
 * special, cloud (165) voor zorg, warm (25) voor onbetaald.
 */
export const LEAVE_TYPE_HUES: Record<LeaveTypeKey, number> = {
  vacation_legal: 50,
  vacation_extra: 50,
  pregnancy: 350,
  maternity: 350,
  birth_partner: 320,
  additional_birth: 320,
  adoption: 290,
  parental_paid: 145,
  parental_unpaid: 145,
  short_care: 165,
  long_care: 165,
  calamity: 25,
  special: 280,
  unpaid: 25,
};
