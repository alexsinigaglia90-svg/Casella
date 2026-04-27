import { describe, it, expect } from "vitest";

import { computeMonthlyBonus, determineApplicablePct } from "../formula";

describe("computeMonthlyBonus", () => {
  it("calculates nettowinst correct (full-time at baseline)", () => {
    const r = computeMonthlyBonus({
      approvedHoursPerProject: new Map([["p1", 168]]),
      projectRates: new Map([["p1", 75]]),
      brutoSalarisMaandCents: 460000,
      vakantietoeslagPctYearly: 8.0,
      werkgeverslastenPct: 30.0,
      indirecteKostenPerMaandCents: 50000,
      autoStelpostMaandCents: 0,
      baselineTariefPerUur: 75,
      workingHoursThisMonth: 168,
    });
    expect(r.brutoOmzetCents).toBe(168 * 75 * 100); // 1.260.000 cents = €12.600
    expect(r.qualifiesForBaseline).toBe(true);
  });

  it("disqualifies when <50% werkbare uren", () => {
    const r = computeMonthlyBonus({
      approvedHoursPerProject: new Map([["p1", 80]]),
      projectRates: new Map([["p1", 75]]),
      brutoSalarisMaandCents: 460000,
      vakantietoeslagPctYearly: 8.0,
      werkgeverslastenPct: 30.0,
      indirecteKostenPerMaandCents: 50000,
      autoStelpostMaandCents: 0,
      baselineTariefPerUur: 75,
      workingHoursThisMonth: 168,
    });
    expect(r.qualifiesForBaseline).toBe(false); // 80/168 ≈ 47%
  });

  it("disqualifies when avg-rate <baseline", () => {
    const r = computeMonthlyBonus({
      approvedHoursPerProject: new Map([
        ["p1", 100],
        ["p2", 80],
      ]),
      projectRates: new Map([
        ["p1", 70],
        ["p2", 60],
      ]),
      brutoSalarisMaandCents: 460000,
      vakantietoeslagPctYearly: 8.0,
      werkgeverslastenPct: 30.0,
      indirecteKostenPerMaandCents: 50000,
      autoStelpostMaandCents: 0,
      baselineTariefPerUur: 75,
      workingHoursThisMonth: 168,
    });
    expect(r.qualifiesForBaseline).toBe(false);
  });
});

describe("determineApplicablePct", () => {
  it("returns abovePct at >=9 qualified months", () => {
    expect(determineApplicablePct(9, 10, 15)).toBe(15);
    expect(determineApplicablePct(12, 10, 15)).toBe(15);
  });

  it("returns belowPct below 9", () => {
    expect(determineApplicablePct(8, 10, 15)).toBe(10);
  });
});
