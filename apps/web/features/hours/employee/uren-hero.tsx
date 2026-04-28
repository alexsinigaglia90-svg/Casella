import {
  HeroPassportCard,
  PassportStat,
  WatermarkGlyph,
} from "@/components/design";
import { formatHoursNl, getIsoWeekNumber } from "@/features/hours/employee/date-utils";
import { DOMAIN_HUES, oklchEmphasis, oklchSubtleBg } from "@/lib/design/oklch";

const NL_MONTH_FULL = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

const NL_DAY_FULL = [
  "zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag",
];

export interface UrenHeroProps {
  weekStart: string;
  weekTotal: number;
  toApprove: number;
  approved: number;
  status: "draft" | "submitted" | "approved" | "rejected" | "mixed" | "empty";
}

const STATUS_CHIP: Record<UrenHeroProps["status"], { label: string; hue: number }> = {
  empty: { label: "Leeg", hue: DOMAIN_HUES.cool },
  draft: { label: "Concept", hue: DOMAIN_HUES.cool },
  submitted: { label: "Wacht op goedkeuring", hue: DOMAIN_HUES.sun },
  approved: { label: "Goedgekeurd", hue: DOMAIN_HUES.harvest },
  rejected: { label: "Afgewezen", hue: DOMAIN_HUES.warm },
  mixed: { label: "Gemengd", hue: DOMAIN_HUES.cool },
};

export function UrenHero({
  weekStart,
  weekTotal,
  toApprove,
  approved,
  status,
}: UrenHeroProps) {
  const start = new Date(weekStart);
  const friday = new Date(start);
  friday.setUTCDate(friday.getUTCDate() + 4);
  const weekNum = getIsoWeekNumber(start);
  const year = start.getUTCFullYear();

  const startDay = NL_DAY_FULL[start.getUTCDay()] ?? "";
  const startNum = start.getUTCDate();
  const startMonth = NL_MONTH_FULL[start.getUTCMonth()] ?? "";
  const friNum = friday.getUTCDate();
  const friMonth = NL_MONTH_FULL[friday.getUTCMonth()] ?? "";
  const sameMonth = start.getUTCMonth() === friday.getUTCMonth();

  const chip = STATUS_CHIP[status];

  return (
    <HeroPassportCard
      watermark={
        <WatermarkGlyph
          glyph={`W${weekNum}`}
          size={280}
          position="bottom-right"
        />
      }
    >
      <div className="grid grid-cols-12 gap-6 p-8 md:p-10">
        <div className="col-span-12 md:col-span-8">
          <div
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "var(--fg-tertiary)",
            }}
          >
            Mijn uren · week {weekNum} · {year}
          </div>
          <h1
            className="mt-3 font-display"
            style={{
              fontSize: "clamp(2.4rem, 3vw, 3.5rem)",
              fontWeight: 500,
              lineHeight: 0.95,
              color: "var(--fg-primary)",
            }}
          >
            <em>
              {startDay} {startNum}
              {sameMonth ? "" : ` ${startMonth}`}
            </em>
            <span> — vrijdag {friNum} {friMonth}</span>
          </h1>
          <p
            className="mt-3 max-w-xl"
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: "var(--fg-secondary)",
            }}
          >
            Standaard werkdagen blijven leeg. Vul alleen wat afwijkt — verlof,
            ziekte, of feestdagen krijgen een eigen tint.{" "}
            <span style={{ color: "var(--fg-tertiary)" }}>
              Auto-opslaan na 2 seconden.
            </span>
          </p>

          <div className="mt-7 flex items-center gap-3">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.16em",
                background: oklchSubtleBg(chip.hue),
                color: oklchEmphasis(chip.hue),
                border: `1px solid ${oklchEmphasis(chip.hue)}33`,
              }}
            >
              <span
                aria-hidden
                className="size-1.5 rounded-full"
                style={{ background: oklchEmphasis(chip.hue) }}
              />
              {chip.label}
            </span>
          </div>
        </div>

        <div
          className="col-span-12 grid grid-cols-3 gap-6 md:col-span-4"
        >
          <PassportStat
            label="Ingevuld"
            value={`${formatHoursNl(weekTotal)} u`}
            sub="deze week"
          />
          <PassportStat
            label="Te accorderen"
            value={`${formatHoursNl(toApprove)} u`}
            sub="wacht op admin"
          />
          <PassportStat
            label="Goedgekeurd"
            value={`${formatHoursNl(approved)} u`}
            sub="dit jaar"
          />
        </div>
      </div>
    </HeroPassportCard>
  );
}
