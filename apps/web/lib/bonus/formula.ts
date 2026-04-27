// Pure bonus-formule helpers per artikel 7 van de standaard arbeidsovereenkomst.
// Geen server-only imports — formula.ts is puur en client-bruikbaar.

export interface BonusInputs {
  approvedHoursPerProject: Map<string, number>;
  projectRates: Map<string, number>; // EUR/h excl BTW
  brutoSalarisMaandCents: number;
  vakantietoeslagPctYearly: number; // 8.0 default
  werkgeverslastenPct: number; // 30.0 default
  indirecteKostenPerMaandCents: number; // 50000 = 500 EUR
  autoStelpostMaandCents: number; // 0 unless contract enables
  baselineTariefPerUur: number; // 75 default
  workingHoursThisMonth: number;
}

export interface BonusComputeResult {
  brutoOmzetCents: number;
  directKostenCents: number;
  indirectKostenCents: number;
  nettowinstCents: number;
  qualifiesForBaseline: boolean;
}

export function computeMonthlyBonus(input: BonusInputs): BonusComputeResult {
  let totalHours = 0;
  let revenueEur = 0;
  for (const [projectId, hours] of input.approvedHoursPerProject) {
    const rate = input.projectRates.get(projectId);
    if (rate == null) continue;
    totalHours += hours;
    revenueEur += hours * rate;
  }
  const brutoOmzetCents = Math.round(revenueEur * 100);

  const werkgeverslastenCents = Math.round(
    (input.brutoSalarisMaandCents * input.werkgeverslastenPct) / 100,
  );
  const vakantietoeslagMonthlyCents = Math.round(
    (input.brutoSalarisMaandCents * input.vakantietoeslagPctYearly) / 100 / 12,
  );
  const directKostenCents =
    input.brutoSalarisMaandCents +
    werkgeverslastenCents +
    vakantietoeslagMonthlyCents +
    input.autoStelpostMaandCents;

  const indirectKostenCents = input.indirecteKostenPerMaandCents;

  const nettowinstCents =
    brutoOmzetCents - directKostenCents - indirectKostenCents;

  const halfWerkbaar = input.workingHoursThisMonth * 0.5;
  const meetsHoursMin = totalHours >= halfWerkbaar;
  const avgRate = totalHours > 0 ? revenueEur / totalHours : 0;
  const meetsRateMin = avgRate >= input.baselineTariefPerUur;
  const qualifiesForBaseline = meetsHoursMin && meetsRateMin;

  return {
    brutoOmzetCents,
    directKostenCents,
    indirectKostenCents,
    nettowinstCents,
    qualifiesForBaseline,
  };
}

export function determineApplicablePct(
  qualifiedMonthsLast12: number,
  belowPct: number,
  abovePct: number,
): number {
  return qualifiedMonthsLast12 >= 9 ? abovePct : belowPct;
}
