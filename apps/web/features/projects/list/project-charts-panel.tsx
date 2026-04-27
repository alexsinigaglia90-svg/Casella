"use client";

import { useEffect, useState } from "react";

import type { ProjectListRow } from "@/app/(admin)/admin/projecten/queries";
import type { ProjectListPrefs } from "@/lib/list-prefs-cookie-shared-projects";

// ── Stub data helpers ─────────────────────────────────────────────────────────

function hashFrac(s: string, seed = 0): number {
  let h = seed * 2654435761;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/** Generate 12-month stub omzet for a project (monthly, in k€). */
function stubMonthlyOmzet(projectId: string): number[] {
  return Array.from({ length: 12 }, (_, i) => {
    const base = 20 + hashFrac(projectId, i * 7) * 60;
    return Math.round(base * 10) / 10;
  });
}

/** Generate 12-month portfolio omzet (sum-ish of all rows). */
function portfolioMonthlyOmzet(rows: ProjectListRow[]): number[] {
  if (rows.length === 0) return Array(12).fill(0);
  return Array.from({ length: 12 }, (_, i) => {
    return rows.reduce((acc, r) => acc + 20 + hashFrac(r.id, i * 7) * 60, 0);
  });
}

/** Prognose = actual * 1.1 + small trend. */
function prognoseFromActual(actual: number[]): number[] {
  return actual.map((v, i) => Math.round((v * (1.1 + i * 0.005)) * 10) / 10);
}

const ROLE_HUE: Record<string, number> = {
  PM: 265,
  Lead: 340,
  Designer: 25,
  Developer: 200,
  Strategy: 145,
  Research: 290,
};
const ROLES = Object.keys(ROLE_HUE);

function stubRoleMix(projectId: string): Record<string, number> {
  const raw = ROLES.map((r, i) => hashFrac(projectId, i * 11 + 1) + 0.1);
  const total = raw.reduce((a, b) => a + b, 0);
  const result: Record<string, number> = {};
  ROLES.forEach((r, i) => {
    result[r] = Math.round(((raw[i] ?? 0) / total) * 100);
  });
  return result;
}

function roleColor(role: string): string {
  const hue = ROLE_HUE[role] ?? 200;
  return `oklch(0.78 0.10 ${hue})`;
}

/** Stub bureau segments (3-4). */
function stubBureauSegments(id: string): { label: string; pct: number; hue: number }[] {
  const bureaus = ["Nord", "Studio A", "Lab", "East"];
  const raw = bureaus.map((_, i) => hashFrac(id, i * 9 + 2) + 0.05);
  const total = raw.reduce((a, b) => a + b, 0);
  return bureaus.map((b, i) => ({
    label: b,
    pct: Math.round(((raw[i] ?? 0) / total) * 100),
    hue: 200 + i * 45,
  }));
}

/** Stub top medewerkers. */
function stubTopMedewerkers(id: string, n = 5): { name: string; uren: number; hue: number }[] {
  const names = ["Alex S.", "Bo V.", "Cara D.", "Daan K.", "Eva L.", "Frank H.", "Gwen M."];
  const shuffled = [...names].sort(() => hashFrac(id + "top", names.indexOf(id)) - 0.5);
  return shuffled.slice(0, n).map((name, i) => ({
    name,
    uren: Math.round(60 + hashFrac(id, i * 17) * 140),
    hue: 200 + i * 30,
  }));
}

// ── NL month labels ───────────────────────────────────────────────────────────

const NL_M = ["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"];

// ── Chart: Omzet vs Prognose ──────────────────────────────────────────────────

function OmzetLineChart({
  actual,
  prognose,
  showForecast,
}: {
  actual: number[];
  prognose: number[];
  showForecast: boolean;
}) {
  const W = 380;
  const H = 120;
  const PAD = { t: 8, r: 8, b: 22, l: 36 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;

  const allVals = showForecast ? [...actual, ...prognose] : actual;
  const maxV = Math.max(...allVals, 1);

  function x(i: number) {
    return PAD.l + (i / (actual.length - 1)) * cW;
  }
  function y(v: number) {
    return PAD.t + cH - (v / maxV) * cH;
  }

  const actualPath = actual
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(" ");

  const areaPath =
    actualPath +
    ` L${x(actual.length - 1).toFixed(1)},${(PAD.t + cH).toFixed(1)} L${PAD.l.toFixed(1)},${(PAD.t + cH).toFixed(1)} Z`;

  const prognosePath = showForecast
    ? prognose
        .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
        .join(" ")
    : "";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ overflow: "visible", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="omzet-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.72 0.14 265)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="oklch(0.72 0.14 265)" stopOpacity="0.01" />
        </linearGradient>
        <clipPath id="omzet-clip">
          <rect x={PAD.l} y={PAD.t} width={cW} height={cH} />
        </clipPath>
      </defs>

      {/* Gridlines */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={PAD.l}
          x2={PAD.l + cW}
          y1={PAD.t + cH * (1 - f)}
          y2={PAD.t + cH * (1 - f)}
          stroke="var(--border-subtle)"
          strokeWidth="0.5"
        />
      ))}

      {/* Area */}
      <path d={areaPath} fill="url(#omzet-grad)" clipPath="url(#omzet-clip)" />

      {/* Actual line */}
      <path
        d={actualPath}
        fill="none"
        stroke="oklch(0.72 0.14 265)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        clipPath="url(#omzet-clip)"
      />

      {/* Prognose line */}
      {showForecast && (
        <path
          d={prognosePath}
          fill="none"
          stroke="oklch(0.72 0.14 265)"
          strokeWidth="1"
          strokeDasharray="4 3"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeOpacity="0.5"
          clipPath="url(#omzet-clip)"
        />
      )}

      {/* Month labels */}
      {[0, 3, 6, 9, 11].map((i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 4}
          textAnchor="middle"
          fontSize="8"
          fill="var(--fg-tertiary)"
          fontFamily="ui-monospace,monospace"
        >
          {NL_M[i]}
        </text>
      ))}

      {/* Y axis max label */}
      <text
        x={PAD.l - 4}
        y={PAD.t + 4}
        textAnchor="end"
        fontSize="8"
        fill="var(--fg-tertiary)"
        fontFamily="ui-monospace,monospace"
      >
        {maxV.toFixed(0)}k
      </text>
    </svg>
  );
}

// ── Chart: Uren-mix per rol ───────────────────────────────────────────────────

function UrenMixChart({ roleMix }: { roleMix: Record<string, number> }) {
  const W = 380;
  const ROW_H = 20;
  const BAR_X = 100;
  const BAR_W = W - BAR_X - 8;
  const H = ROLES.length * ROW_H + 4;
  const maxPct = Math.max(...Object.values(roleMix), 1);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      {ROLES.map((role, i) => {
        const pct = roleMix[role] ?? 0;
        const barLen = (pct / maxPct) * BAR_W;
        const cy = i * ROW_H + ROW_H / 2;
        return (
          <g key={role}>
            <text
              x={BAR_X - 6}
              y={cy + 4}
              textAnchor="end"
              fontSize="9"
              fill="var(--fg-secondary)"
              fontFamily="ui-sans-serif,system-ui,sans-serif"
            >
              {role}
            </text>
            <rect
              x={BAR_X}
              y={cy - 6}
              width={BAR_W}
              height={12}
              rx="3"
              fill="var(--surface-lift)"
            />
            <rect
              x={BAR_X}
              y={cy - 6}
              width={Math.max(barLen, 2)}
              height={12}
              rx="3"
              fill={roleColor(role)}
              opacity="0.85"
            />
            <text
              x={BAR_X + barLen + 4}
              y={cy + 4}
              fontSize="8"
              fill="var(--fg-tertiary)"
              fontFamily="ui-monospace,monospace"
            >
              {pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Chart: Bureau donut ───────────────────────────────────────────────────────

function BureauDonut({ segments }: { segments: { label: string; pct: number; hue: number }[] }) {
  const R = 26;
  const CX = 34;
  const CY = 34;
  const circumference = 2 * Math.PI * R;

  let acc = 0;
  const arcs = segments.map((s) => {
    const dash = (s.pct / 100) * circumference;
    const offset = -(acc / 100) * circumference;
    acc += s.pct;
    return { ...s, dash, offset };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width={68} height={68} viewBox="0 0 68 68" aria-hidden="true">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--surface-lift)" strokeWidth="10" />
        {arcs.map((a) => (
          <circle
            key={a.label}
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={`oklch(0.78 0.10 ${a.hue})`}
            strokeWidth="10"
            strokeDasharray={`${a.dash.toFixed(2)} ${(circumference - a.dash).toFixed(2)}`}
            strokeDashoffset={a.offset.toFixed(2)}
            strokeLinecap="butt"
            style={{ transform: "rotate(-90deg)", transformOrigin: `${CX}px ${CY}px` }}
          />
        ))}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {arcs.map((a) => (
          <div key={a.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: `oklch(0.78 0.10 ${a.hue})`,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 10, color: "var(--fg-secondary)", fontFamily: "ui-sans-serif,system-ui,sans-serif" }}>
              {a.label} <span style={{ color: "var(--fg-tertiary)", fontFamily: "ui-monospace,monospace" }}>{a.pct}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Top medewerkers ───────────────────────────────────────────────────────────

function TopMedewerkersCard({ id }: { id: string }) {
  const top = stubTopMedewerkers(id);
  const maxU = Math.max(...top.map((t) => t.uren), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {top.map((m) => (
        <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: `oklch(0.78 0.10 ${m.hue})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {m.name.slice(0, 1)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "var(--fg-primary)", fontWeight: 500, marginBottom: 2 }}>
              {m.name}
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 2,
                background: "var(--surface-lift)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(m.uren / maxU) * 100}%`,
                  background: `oklch(0.72 0.10 ${m.hue})`,
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
          <span style={{ fontSize: 10, fontFamily: "ui-monospace,monospace", color: "var(--fg-tertiary)", flexShrink: 0 }}>
            {m.uren}u
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border glass-card"
      style={{ borderColor: "var(--border-subtle)", padding: "14px 16px" }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--fg-tertiary)",
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

// ── ProjectChartsPanel ────────────────────────────────────────────────────────

interface ProjectChartsPanelProps {
  rows: ProjectListRow[];
  selectedId: string | null;
  prefs: ProjectListPrefs;
}

export function ProjectChartsPanel({ rows, selectedId, prefs }: ProjectChartsPanelProps) {
  const [visible, setVisible] = useState(false);

  // Fade-in on selection change
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, [selectedId]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const title = selected ? selected.name : "Portfolio";

  // Compute chart data
  const actual = selected
    ? stubMonthlyOmzet(selected.id)
    : portfolioMonthlyOmzet(rows);
  const prognose = prognoseFromActual(actual);
  const roleMix = selected ? stubRoleMix(selected.id) : stubRoleMix("portfolio");
  const bureauSegments = selected
    ? stubBureauSegments(selected.id)
    : stubBureauSegments("portfolio");

  if (!prefs.showCharts) {
    return (
      <div
        className="rounded-xl border glass-card flex flex-col items-center justify-center"
        style={{
          borderColor: "var(--border-subtle)",
          minHeight: 200,
          padding: 32,
          textAlign: "center",
        }}
      >
        <p style={{ color: "var(--fg-tertiary)", fontSize: 13 }}>
          Charts verborgen via tweaks-dock
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.18s ease",
      }}
    >
      {/* Panel header */}
      <div style={{ paddingLeft: 4, paddingBottom: 4 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--fg-tertiary)",
            marginBottom: 2,
          }}
        >
          {selected ? "Project" : "Portfolio"}
        </div>
        <h2
          className="font-display"
          style={{ fontSize: "var(--text-title)", lineHeight: 1.2 }}
        >
          {title}
        </h2>
      </div>

      {/* Chart 1: Omzet vs prognose */}
      <ChartCard title="Omzet vs prognose">
        <OmzetLineChart actual={actual} prognose={prognose} showForecast={prefs.showForecast} />
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <LegendItem color="oklch(0.72 0.14 265)" label="Omzet" />
          {prefs.showForecast && (
            <LegendItem color="oklch(0.72 0.14 265)" label="Prognose" dashed />
          )}
        </div>
      </ChartCard>

      {/* Chart 2: Uren-mix per rol */}
      <ChartCard title="Uren-mix per rol">
        <UrenMixChart roleMix={roleMix} />
      </ChartCard>

      {/* Chart 3: Bureau-verdeling */}
      <ChartCard title="Bureau-verdeling">
        <BureauDonut segments={bureauSegments} />
      </ChartCard>

      {/* Chart 4: Top medewerkers (optional) */}
      {prefs.showTopMedewerkers && (
        <ChartCard title="Top medewerkers">
          {/* TODO 1.6: vervang stub door echte project_assignments + hour_entries aggregatie */}
          <TopMedewerkersCard id={selected?.id ?? "portfolio"} />
        </ChartCard>
      )}

      {!selected && (
        <p
          style={{
            fontSize: 11,
            color: "var(--fg-tertiary)",
            textAlign: "center",
            paddingBottom: 4,
          }}
        >
          Klik op een rij voor project-detail
        </p>
      )}
    </div>
  );
}

function LegendItem({
  color,
  label,
  dashed = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <svg width="20" height="10" style={{ flexShrink: 0 }} aria-hidden="true">
        <line
          x1="0"
          y1="5"
          x2="20"
          y2="5"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={dashed ? "4 3" : "none"}
          strokeLinecap="round"
        />
      </svg>
      <span style={{ fontSize: 10, color: "var(--fg-secondary)", fontFamily: "ui-sans-serif,system-ui,sans-serif" }}>
        {label}
      </span>
    </div>
  );
}
