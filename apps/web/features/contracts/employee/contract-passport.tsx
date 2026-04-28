import {
  HeroPassportCard,
  PassportStat,
  SealStamp,
  WatermarkGlyph,
} from "@/components/design";
import { DOMAIN_HUES } from "@/lib/design/oklch";

const MONTHS_NL_SHORT = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

function fmtMonthShort(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS_NL_SHORT[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

function yearsBetween(startIso: string, today: Date = new Date()): number {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return 0;
  const ms = today.getTime() - start.getTime();
  return ms / (1000 * 60 * 60 * 24 * 365.25);
}

export interface ContractPassportProps {
  firstName: string;
  lastName: string;
  jobTitle: string;
  team: string | null;
  startDate: string;
  endDate: string | null;
  hoursPerWeek: number;
  managerName: string | null;
  contractStartDate: string;
}

export function ContractPassport({
  firstName,
  lastName,
  jobTitle,
  team,
  startDate,
  endDate,
  hoursPerWeek,
  managerName,
  contractStartDate,
}: ContractPassportProps) {
  const isVast = endDate == null;
  const hue = isVast ? DOMAIN_HUES.harvest : DOMAIN_HUES.sun;
  const tenure = yearsBetween(startDate);
  const tenureLabel = `${tenure.toFixed(1).replace(".", ",")} jaar bij Casella`;
  const managerFirstName = managerName ? managerName.split(" ")[0] : null;

  return (
    <HeroPassportCard
      watermark={<WatermarkGlyph glyph="C" size={280} position="top-right" />}
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
            Arbeidsovereenkomst · Casella B.V.
          </div>
          <h1
            className="mt-4 font-display"
            style={{
              fontSize: "clamp(3rem, 4vw, 4.5rem)",
              fontWeight: 500,
              lineHeight: 0.92,
              color: "var(--fg-primary)",
            }}
          >
            <span>{firstName} </span>
            <em>{lastName}</em>
          </h1>
          <div
            className="mt-3 flex items-baseline gap-3"
            style={{ fontSize: 15, color: "var(--fg-secondary)" }}
          >
            <span
              className="font-display italic"
              style={{ fontSize: 22 }}
            >
              {jobTitle}
            </span>
            {team && (
              <>
                <span style={{ color: "var(--fg-quaternary)" }}>·</span>
                <span>{team}</span>
              </>
            )}
          </div>

          <div className="mt-8 grid max-w-md grid-cols-3 gap-6">
            <PassportStat
              label="In dienst"
              value={fmtMonthShort(contractStartDate)}
              sub={tenureLabel}
            />
            <PassportStat
              label="Uren / week"
              value={`${hoursPerWeek}u`}
              sub="ma — vr"
            />
            <PassportStat
              label="Manager"
              value={managerFirstName ?? "—"}
              sub={managerFirstName ? "team-lead" : "geen toegewezen"}
            />
          </div>
        </div>

        <div className="col-span-12 flex items-center justify-center md:col-span-5 md:justify-end">
          <SealStamp
            hue={hue}
            centerLabel="Type"
            centerValue={isVast ? "VAST" : "Tijdelijk"}
            centerSub={
              endDate
                ? `tot ${fmtMonthShort(endDate)}`
                : "onbepaalde tijd"
            }
            ringText="CASELLA · ARBEIDSOVEREENKOMST · CASELLA · ARBEIDSOVEREENKOMST ·"
            pillText="✓ Ondertekend"
          />
        </div>
      </div>
    </HeroPassportCard>
  );
}
