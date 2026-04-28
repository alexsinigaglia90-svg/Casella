import type { NmbrsPayslipSummary } from "@casella/nmbrs";

import {
  HeroPassportCard,
  PassportStat,
  SealStamp,
  WatermarkGlyph,
} from "@/components/design";
import { DOMAIN_HUES } from "@/lib/design/oklch";

const MONTHS_NL_FULL = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

const MONTHS_NL_SHORT = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

function formatEur(cents: number): string {
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export interface PayslipHeroProps {
  payslip: NmbrsPayslipSummary;
  employeeName: string;
}

export function PayslipHero({ payslip, employeeName }: PayslipHeroProps) {
  const monthIdx = (payslip.period - 1) % 12;
  const monthFull = MONTHS_NL_FULL[monthIdx] ?? "—";
  const monthShort = MONTHS_NL_SHORT[monthIdx] ?? "—";
  const year2 = String(payslip.year).slice(2);

  return (
    <HeroPassportCard
      watermark={<WatermarkGlyph glyph="€" size={320} position="top-right" />}
    >
      <div className="grid grid-cols-12 gap-8 p-10">
        <div className="col-span-12 md:col-span-7">
          <div
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "var(--fg-tertiary)",
            }}
          >
            Loonstrook · {monthFull} {payslip.year}
          </div>
          <h1
            className="mt-3 font-display"
            style={{
              fontSize: "clamp(2.75rem, 4vw, 4rem)",
              fontWeight: 500,
              lineHeight: 0.92,
              color: "var(--fg-primary)",
            }}
          >
            <span>Je salaris voor </span>
            <em>{monthFull}</em>
          </h1>
          <div
            className="mt-3 font-display italic"
            style={{ fontSize: 18, color: "var(--fg-secondary)" }}
          >
            {employeeName}
          </div>

          <div className="mt-7 grid max-w-md grid-cols-2 gap-6">
            <PassportStat
              label="Bruto"
              value={formatEur(payslip.amountGrossCents)}
              sub="vóór inhoudingen"
            />
            <PassportStat
              label="Beschikbaar sinds"
              value={payslip.availableSince}
              sub="via Nmbrs"
            />
          </div>
        </div>

        <div className="col-span-12 flex items-center justify-center md:col-span-5 md:justify-end">
          <SealStamp
            hue={DOMAIN_HUES.cloud}
            centerLabel="Periode"
            centerValue={`${monthShort} '${year2}`}
            centerSub={`Periode ${payslip.period}`}
            ringText="CASELLA · LOONSTROOK · NMBRS · CASELLA · LOONSTROOK · NMBRS ·"
            pillText="✓ Verwerkt"
          />
        </div>
      </div>
    </HeroPassportCard>
  );
}
