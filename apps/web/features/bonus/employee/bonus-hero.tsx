import {
  BreakdownStat,
  HeroPassportCard,
  WatermarkGlyph,
} from "@/components/design";
import { DOMAIN_HUES, oklchEmphasis } from "@/lib/design/oklch";

function fmtEur(cents: number): string {
  const sign = cents < 0 ? "−" : "";
  const abs = Math.abs(cents);
  return `${sign}€ ${(abs / 100).toLocaleString("nl-NL", {
    maximumFractionDigits: 0,
  })}`;
}

interface MeterProps {
  pct: number; // 0-1.4 (capped at 140%)
  expectedTotalCents: number;
}

function Meter({ pct, expectedTotalCents }: MeterProps) {
  const clamped = Math.min(1.4, Math.max(0, pct));
  const r = 110;
  const cx = 140;
  const cy = 140;
  const startAngle = 225;
  const sweep = 270;

  const polar = (deg: number): [number, number] => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  const [sx, sy] = polar(startAngle);
  const endAngle = startAngle + sweep;
  const [ex, ey] = polar(endAngle);
  const arcDeg = clamped * 270;
  const [px, py] = polar(startAngle + arcDeg);

  const trackPath = `M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`;
  const fillPath = `M ${sx} ${sy} A ${r} ${r} 0 ${
    arcDeg > 180 ? 1 : 0
  } 1 ${px} ${py}`;
  const tickAt100 = polar(startAngle + 270 / 1.4);
  const onTrack = clamped >= 1;

  return (
    <svg width={280} height={260} viewBox="0 0 280 280">
      <defs>
        <linearGradient id="bonusMeterGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`oklch(0.65 0.18 ${DOMAIN_HUES.sun})`} />
          <stop offset="50%" stopColor="oklch(0.65 0.18 100)" />
          <stop
            offset="100%"
            stopColor={`oklch(0.55 0.20 ${DOMAIN_HUES.harvest})`}
          />
        </linearGradient>
      </defs>
      <path
        d={trackPath}
        fill="none"
        stroke="rgba(14,22,33,0.08)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d={fillPath}
        fill="none"
        stroke="url(#bonusMeterGrad)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <line
        x1={tickAt100[0] - 4}
        y1={tickAt100[1]}
        x2={tickAt100[0] + 4}
        y2={tickAt100[1]}
        stroke={oklchEmphasis(DOMAIN_HUES.harvest)}
        strokeWidth="2"
      />
      <text
        x={tickAt100[0] + 18}
        y={tickAt100[1] + 5}
        textAnchor="middle"
        fontSize="9"
        fontFamily="var(--font-geist-mono)"
        fill={oklchEmphasis(DOMAIN_HUES.harvest)}
        letterSpacing="1"
      >
        100%
      </text>

      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fontSize="11"
        fontFamily="var(--font-geist-mono)"
        fill="rgba(14,22,33,0.50)"
        letterSpacing="2"
      >
        VOORTGANG
      </text>
      <text
        x={cx}
        y={cy + 30}
        textAnchor="middle"
        fontSize="42"
        fontFamily="var(--font-cormorant)"
        fill="var(--fg-primary)"
        fontWeight="500"
      >
        {Math.round(clamped * 100)}%
      </text>
      <text
        x={cx}
        y={cy + 52}
        textAnchor="middle"
        fontSize="11"
        fill={
          onTrack
            ? oklchEmphasis(DOMAIN_HUES.harvest)
            : oklchEmphasis(DOMAIN_HUES.sun)
        }
      >
        {onTrack ? "boven target" : "op koers"}
        {" — "}
        {fmtEur(expectedTotalCents)}
      </text>
    </svg>
  );
}

export interface BonusHeroProps {
  year: number;
  totalEarnedCents: number; // accrual + adjustment
  ytdPaidCents: number;
  outstandingCents: number;
  // Placeholder target until BONUS-TARGET-AND-HISTORICAL-COMPARE lands.
  targetCents: number;
}

export function BonusHero({
  year,
  totalEarnedCents,
  ytdPaidCents,
  outstandingCents,
  targetCents,
}: BonusHeroProps) {
  const expectedTotal = totalEarnedCents; // best estimate without forecasting
  const pct = targetCents > 0 ? expectedTotal / targetCents : 0;

  // Breakdown buckets: paid (harvest, klaar) / outstanding (sun, rijpen) / 0 onderweg (cool, in behandeling)
  // Geen "onderweg" data in DB — placeholder van 0 met deferred BONUS-IN-BEHANDELING-LEDGER.
  const ripening = outstandingCents;
  const ready = ytdPaidCents;
  const onTheWay = 0;

  return (
    <HeroPassportCard
      watermark={
        <WatermarkGlyph
          glyph={`'${String(year).slice(2)}`}
          size={320}
          position="bottom-right"
        />
      }
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
            Mijn bonus · {year} · uit billable uren
          </div>
          <h1
            className="mt-3 font-display"
            style={{
              fontSize: "clamp(3rem, 4vw, 4.25rem)",
              fontWeight: 500,
              lineHeight: 0.92,
              color: "var(--fg-primary)",
            }}
          >
            <span>Je bent op koers voor </span>
            <em>{fmtEur(expectedTotal)}</em>
          </h1>
          <p
            className="mt-3 max-w-lg"
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--fg-secondary)",
            }}
          >
            Berekend over jouw billable uren × marge per uur × bonus-percentage
            uit je contract.{" "}
            <span style={{ color: "var(--fg-tertiary)" }}>
              Winstdeling staat hier los van.
            </span>
          </p>

          <div className="mt-7 grid max-w-xl grid-cols-3 gap-4">
            <BreakdownStat
              label="Aan het rijpen"
              value={fmtEur(ripening)}
              hue={DOMAIN_HUES.sun}
              sub="lopend, in opbouw"
            />
            <BreakdownStat
              label="Klaar te oogsten"
              value={fmtEur(ready)}
              hue={DOMAIN_HUES.harvest}
              sub="dit jaar uitbetaald"
              emphasis
            />
            <BreakdownStat
              label="Onderweg"
              value={fmtEur(onTheWay)}
              hue={DOMAIN_HUES.cool}
              sub="in behandeling"
            />
          </div>
        </div>

        <div
          className="col-span-12 flex items-center justify-center md:col-span-5"
          style={{ minHeight: 280 }}
        >
          <Meter pct={pct} expectedTotalCents={expectedTotal} />
        </div>
      </div>
    </HeroPassportCard>
  );
}
