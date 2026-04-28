import { DOMAIN_HUES, oklchEmphasis, oklchSubtleBg } from "@/lib/design/oklch";
import {
  daysSick,
  getMilestoneStatus,
  POORTWACHTER_MILESTONES,
} from "@/lib/sick/poortwachter";

export interface SickOverviewItem {
  id: string;
  employeeName: string;
  startDate: string;
  endDate: string | null;
  expectedDurationDays: number | null;
  availabilityStatus: string | null;
}

const AVAILABILITY_LABEL: Record<string, string> = {
  home: "Werkt eventueel thuis",
  unavailable: "Niet beschikbaar",
  unknown: "Onbekend",
};

const NL_MONTH_SHORT = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${NL_MONTH_SHORT[d.getMonth()] ?? ""} ${d.getFullYear()}`;
}

const HUE_ACTIVE = DOMAIN_HUES.cool;
const HUE_PASSED = DOMAIN_HUES.harvest;
const HUE_CLOSED = DOMAIN_HUES.cloud;

interface MilestoneRadarProps {
  startDateIso: string;
  endDateIso: string | null;
}

/**
 * Horizontal Wet Poortwachter timeline. Each milestone shows passed (filled),
 * active (ringed), or upcoming (open). AVG-compliant — no medical details.
 */
function MilestoneRadar({ startDateIso, endDateIso }: MilestoneRadarProps) {
  // Cap the today reference at endDate when the case is closed so passed
  // milestones reflect the actual closed window, not real-time.
  const refToday = endDateIso ? new Date(endDateIso) : new Date();
  const milestones = getMilestoneStatus(startDateIso, refToday);

  return (
    <div className="relative pt-2">
      {/* Track line */}
      <div
        className="absolute left-3 right-3 top-[18px] h-0.5"
        style={{ background: "var(--border-subtle)" }}
        aria-hidden
      />
      <ul
        className="relative grid"
        style={{
          gridTemplateColumns: `repeat(${POORTWACHTER_MILESTONES.length}, minmax(0, 1fr))`,
          gap: 4,
        }}
      >
        {milestones.map((m) => {
          const isPassed = m.status === "passed";
          const isActive = m.status === "active";
          const dotHue = isPassed ? HUE_PASSED : isActive ? HUE_ACTIVE : HUE_CLOSED;
          return (
            <li
              key={m.id}
              className="flex flex-col items-center text-center"
              title={`${m.label} · week ${m.weekNum} · ${fmtDate(m.dueDateIso)}`}
            >
              <span
                aria-hidden
                className="size-3.5 rounded-full"
                style={{
                  background: isPassed
                    ? oklchEmphasis(dotHue)
                    : isActive
                      ? "white"
                      : "transparent",
                  border: `2px solid ${oklchEmphasis(dotHue)}`,
                  boxShadow: isActive
                    ? `0 0 0 4px ${oklchSubtleBg(dotHue)}`
                    : "none",
                }}
              />
              <span
                className="mt-1.5 font-mono uppercase"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.08em",
                  color: isPassed
                    ? oklchEmphasis(dotHue)
                    : "var(--fg-tertiary)",
                }}
              >
                W{m.weekNum}
              </span>
              <span
                className="mt-0.5 leading-tight"
                style={{
                  fontSize: 10,
                  color: "var(--fg-secondary)",
                }}
              >
                {m.shortLabel}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface CaseFileProps {
  item: SickOverviewItem;
}

function CaseFile({ item }: CaseFileProps) {
  const isActive = !item.endDate;
  const days = daysSick(item.startDate, item.endDate);
  const hue = isActive ? HUE_ACTIVE : HUE_CLOSED;
  const availabilityLabel = item.availabilityStatus
    ? (AVAILABILITY_LABEL[item.availabilityStatus] ?? item.availabilityStatus)
    : null;

  return (
    <article
      className="overflow-hidden rounded-2xl border"
      style={{
        borderColor: isActive ? `${oklchEmphasis(hue)}40` : "var(--border-subtle)",
        background: "var(--surface-card)",
      }}
    >
      <header
        className="flex flex-wrap items-start justify-between gap-3 px-6 pb-3 pt-5"
        style={{
          background: isActive
            ? `linear-gradient(135deg, ${oklchSubtleBg(hue)} 0%, var(--surface-card) 90%)`
            : "var(--surface-card)",
        }}
      >
        <div className="min-w-0 flex-1">
          <div
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              color: isActive ? oklchEmphasis(hue) : "var(--fg-tertiary)",
            }}
          >
            {isActive ? "Lopend traject" : "Afgesloten"} · vertrouwelijk
          </div>
          <h3
            className="mt-1.5 font-display"
            style={{
              fontSize: "1.4rem",
              fontWeight: 500,
              color: "var(--fg-primary)",
            }}
          >
            {item.employeeName}
          </h3>
          <div
            className="mt-1 text-sm"
            style={{ color: "var(--fg-secondary)" }}
          >
            <span>Sinds </span>
            <span style={{ color: "var(--fg-primary)" }}>
              {fmtDate(item.startDate)}
            </span>
            {item.endDate && (
              <>
                <span> · t/m </span>
                <span style={{ color: "var(--fg-primary)" }}>
                  {fmtDate(item.endDate)}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="text-right">
          <div
            className="font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.16em",
              color: "var(--fg-tertiary)",
            }}
          >
            Dagen
          </div>
          <div
            className="font-display tabular-nums"
            style={{
              fontSize: "2rem",
              fontWeight: 500,
              lineHeight: 1,
              color: isActive ? oklchEmphasis(hue) : "var(--fg-primary)",
            }}
          >
            {days + 1}
          </div>
          {item.expectedDurationDays && isActive && (
            <div
              className="mt-1 text-xs"
              style={{ color: "var(--fg-tertiary)" }}
            >
              prognose {item.expectedDurationDays}
            </div>
          )}
        </div>
      </header>

      {availabilityLabel && (
        <div
          className="mx-6 mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5"
          style={{
            background: oklchSubtleBg(DOMAIN_HUES.sun),
            color: oklchEmphasis(DOMAIN_HUES.sun),
            fontSize: 11,
          }}
        >
          {availabilityLabel}
        </div>
      )}

      <div
        className="border-t px-5 pb-5 pt-5"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div
          className="mb-3 font-mono uppercase"
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            color: "var(--fg-tertiary)",
          }}
        >
          Wet Poortwachter — mijlpalen
        </div>
        <MilestoneRadar
          startDateIso={item.startDate}
          endDateIso={item.endDate}
        />
      </div>
    </article>
  );
}

export function SickOverview({ items }: { items: SickOverviewItem[] }) {
  if (items.length === 0) {
    return (
      <div
        className="rounded-2xl border p-8 text-center text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          color: "var(--fg-tertiary)",
          background: "var(--surface-card)",
        }}
      >
        Geen ziekmeldingen geregistreerd.
      </div>
    );
  }

  // Sort: active first, then by start-date desc
  const sorted = [...items].sort((a, b) => {
    if (!a.endDate && b.endDate) return -1;
    if (a.endDate && !b.endDate) return 1;
    return b.startDate.localeCompare(a.startDate);
  });

  return (
    <div className="space-y-4">
      {sorted.map((item) => (
        <CaseFile key={item.id} item={item} />
      ))}
    </div>
  );
}
