"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DOMAIN_HUES, oklchEmphasis, oklchSubtleBg } from "@/lib/design/oklch";
import { daysSick } from "@/lib/sick/poortwachter";

export interface SickListItem {
  id: string;
  startDate: string;
  endDate: string | null;
  customPayload: Record<string, unknown> | null;
}

const NL_MONTH_SHORT = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${NL_MONTH_SHORT[d.getMonth()] ?? ""} ${d.getFullYear()}`;
}

const HUE = DOMAIN_HUES.cool;

interface RecoveryCurveProps {
  startDateIso: string;
  expectedDays: number | null;
}

/**
 * SVG recovery curve from "ziek" to "beter" with milestone markers
 * (1 dag / 1 week / 2 wk). The active dot reflects how many days
 * have passed since start.
 */
function RecoveryCurve({ startDateIso, expectedDays }: RecoveryCurveProps) {
  const elapsed = daysSick(startDateIso, null);
  // Map elapsed → 0..1 along the curve. Cap visual progress at 1.
  const horizonDays = expectedDays ?? Math.max(14, elapsed + 7);
  const progress = Math.max(0, Math.min(1, elapsed / horizonDays));

  const width = 600;
  const height = 140;
  const padX = 40;
  const padY = 40;
  const startX = padX;
  const endX = width - padX;
  const startY = height - padY;
  const endY = padY;

  // Smooth ease-out curve via cubic bezier
  const cx1 = startX + (endX - startX) * 0.45;
  const cy1 = startY;
  const cx2 = startX + (endX - startX) * 0.55;
  const cy2 = endY;

  const path = `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`;

  // Position along the curve at progress t: cubic bezier formula
  function bezierPoint(t: number): { x: number; y: number } {
    const omt = 1 - t;
    const x =
      omt * omt * omt * startX +
      3 * omt * omt * t * cx1 +
      3 * omt * t * t * cx2 +
      t * t * t * endX;
    const y =
      omt * omt * omt * startY +
      3 * omt * omt * t * cy1 +
      3 * omt * t * t * cy2 +
      t * t * t * endY;
    return { x, y };
  }

  const dot = bezierPoint(progress);

  // Milestone tick positions: 1 day, 1 week, 2 weeks (relative to horizon).
  const milestones = [
    { days: 1, label: "1 dag" },
    { days: 7, label: "1 week" },
    { days: 14, label: "2 weken" },
  ].filter((m) => m.days < horizonDays);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={`Hersteltijdlijn — dag ${elapsed + 1} van ${horizonDays}`}
    >
      <defs>
        <linearGradient id="recovery-gradient" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor={oklchEmphasis(HUE)} stopOpacity="0.3" />
          <stop offset="100%" stopColor={`oklch(0.55 0.18 ${DOMAIN_HUES.harvest})`} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* Track (full curve, light) */}
      <path
        d={path}
        fill="none"
        stroke={oklchSubtleBg(HUE)}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Progress overlay — same path, but stroke-dash to clip */}
      <path
        d={path}
        fill="none"
        stroke="url(#recovery-gradient)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${progress * 600} 600`}
      />

      {/* Milestone ticks */}
      {milestones.map((m) => {
        const t = m.days / horizonDays;
        const p = bezierPoint(t);
        const passed = elapsed >= m.days;
        return (
          <g key={m.days}>
            <circle
              cx={p.x}
              cy={p.y}
              r="5"
              fill={passed ? oklchEmphasis(HUE) : "white"}
              stroke={oklchEmphasis(HUE)}
              strokeWidth="2"
            />
            <text
              x={p.x}
              y={p.y - 14}
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--font-geist-mono)"
              fill="var(--fg-tertiary)"
              letterSpacing="1"
            >
              {m.label}
            </text>
          </g>
        );
      })}

      {/* Active position dot */}
      <circle
        cx={dot.x}
        cy={dot.y}
        r="9"
        fill={oklchEmphasis(HUE)}
        opacity="0.25"
      />
      <circle
        cx={dot.x}
        cy={dot.y}
        r="5"
        fill={oklchEmphasis(HUE)}
      />

      {/* Endpoint labels */}
      <text
        x={startX}
        y={startY + 22}
        textAnchor="start"
        fontSize="10"
        fontFamily="var(--font-geist-mono)"
        letterSpacing="1.5"
        fill="var(--fg-tertiary)"
      >
        ZIEK
      </text>
      <text
        x={endX}
        y={endY - 14}
        textAnchor="end"
        fontSize="10"
        fontFamily="var(--font-geist-mono)"
        letterSpacing="1.5"
        fill={oklchEmphasis(DOMAIN_HUES.harvest)}
      >
        BETER
      </text>
    </svg>
  );
}

export function SickList({ items }: { items: SickListItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const active = useMemo(() => items.find((i) => i.endDate === null) ?? null, [items]);
  const past = useMemo(() => items.filter((i) => i.endDate !== null), [items]);

  async function handleRecover(id: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/verzuim/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(body.message ?? "Hersteldmelding mislukt");
        return;
      }
      toast.success("Hersteldmelding ontvangen");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setBusy(null);
    }
  }

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
        Nog geen ziekmeldingen geregistreerd.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {active && (
        <div
          className="relative overflow-hidden rounded-2xl border p-6"
          style={{
            borderColor: `${oklchEmphasis(HUE)}40`,
            background: `linear-gradient(135deg, ${oklchSubtleBg(HUE)} 0%, var(--surface-card) 80%)`,
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div
                className="font-mono uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  color: oklchEmphasis(HUE),
                }}
              >
                Lopend traject
              </div>
              <div
                className="mt-2 font-display"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 500,
                  color: "var(--fg-primary)",
                }}
              >
                <span>Ziek sinds </span>
                <em>{fmtDate(active.startDate)}</em>
              </div>
              <div
                className="mt-1 text-sm"
                style={{ color: "var(--fg-secondary)" }}
              >
                Dag {daysSick(active.startDate, null) + 1} van het herstel.
                Geen druk — herstel kost de tijd die het kost.
              </div>
            </div>
            <Button
              size="sm"
              disabled={busy === active.id}
              onClick={() => void handleRecover(active.id)}
              style={{
                background: `oklch(0.55 0.18 ${DOMAIN_HUES.harvest})`,
                color: "white",
              }}
            >
              {busy === active.id ? "…" : "Hersteld melden"}
            </Button>
          </div>

          <div className="mt-6">
            <RecoveryCurve
              startDateIso={active.startDate}
              expectedDays={
                (active.customPayload?.["expectedDurationDays"] as number | null) ??
                null
              }
            />
          </div>
        </div>
      )}

      {past.length > 0 && (
        <section>
          <h2
            className="mb-3 font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              color: "var(--fg-tertiary)",
            }}
          >
            Eerdere ziekmeldingen
          </h2>
          <div
            className="overflow-hidden rounded-2xl border"
            style={{
              borderColor: "var(--border-subtle)",
              background: "var(--surface-card)",
            }}
          >
            {past.map((item, idx) => {
              const expectedDays =
                (item.customPayload?.["expectedDurationDays"] as number | null) ??
                null;
              const days = daysSick(item.startDate, item.endDate);
              return (
                <div
                  key={item.id}
                  className={`flex flex-wrap items-center gap-3 px-5 py-4 ${
                    idx < past.length - 1 ? "border-b" : ""
                  }`}
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className="font-medium"
                      style={{ color: "var(--fg-primary)" }}
                    >
                      {fmtDate(item.startDate)}
                      {item.endDate ? ` — ${fmtDate(item.endDate)}` : ""}
                    </div>
                    <div
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--fg-tertiary)" }}
                    >
                      {days + 1} dag{days === 0 ? "" : "en"} ziek
                      {expectedDays
                        ? ` · prognose was ${expectedDays} dag(en)`
                        : ""}
                    </div>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-0.5 font-mono uppercase"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.16em",
                      background: oklchSubtleBg(DOMAIN_HUES.harvest),
                      color: oklchEmphasis(DOMAIN_HUES.harvest),
                    }}
                  >
                    Hersteld
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
