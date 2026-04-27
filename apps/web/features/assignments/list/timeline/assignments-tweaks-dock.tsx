"use client";

import React, { useState, useRef, useEffect } from "react";

import type { PaletteName } from "@/lib/assignments/palette";
import type {
  AssignmentsAxis,
  AssignmentsHorizon,
  AssignmentsListPrefs,
} from "@/lib/list-prefs-cookie-shared-assignments";
import { useTheme } from "@/lib/use-theme";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

const DOCK_CSS = `
  .atdock{position:fixed;z-index:2147483646;display:flex;align-items:stretch;gap:0;
    padding:4px;background:rgba(250,249,247,.82);
    -webkit-backdrop-filter:blur(28px) saturate(160%);backdrop-filter:blur(28px) saturate(160%);
    border:.5px solid rgba(255,255,255,.7);border-radius:999px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 10px 32px rgba(0,0,0,.18);
    font:11px/1 ui-sans-serif,system-ui,-apple-system,sans-serif;
    color:#29261b;user-select:none;
    transition:border-radius .22s cubic-bezier(.16,1,.3,1);
  }
  .atdock.expanded{border-radius:18px}
  .atdock-handle{display:flex;align-items:center;justify-content:center;
    width:28px;cursor:move;color:rgba(41,38,27,.35);
    border-right:.5px solid rgba(0,0,0,.06);margin-right:2px}
  .atdock-handle svg{width:10px;height:14px}
  .atdock-btn{position:relative;appearance:none;border:0;background:transparent;
    width:32px;height:32px;border-radius:999px;cursor:default;
    display:flex;align-items:center;justify-content:center;color:rgba(41,38,27,.7);
    transition:background .15s,color .15s}
  .atdock-btn:hover{background:rgba(0,0,0,.06);color:#29261b}
  .atdock-btn.on{background:rgba(123,92,255,.12);color:#7b5cff}
  .atdock-btn svg{width:15px;height:15px}
  .atdock-dot{position:absolute;bottom:4px;right:4px;width:6px;height:6px;
    border-radius:50%;border:1.5px solid rgba(250,249,247,.95)}
  .atdock-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.4);
    width:24px;height:32px;border-radius:999px;cursor:default;font-size:12px;
    margin-left:2px;border-left:.5px solid rgba(0,0,0,.06)}
  .atdock-x:hover{color:#29261b;background:rgba(0,0,0,.06)}

  .atdock-pop{position:absolute;bottom:calc(100% + 8px);right:0;min-width:220px;
    padding:10px 12px;background:rgba(250,249,247,.92);
    -webkit-backdrop-filter:blur(28px) saturate(160%);backdrop-filter:blur(28px) saturate(160%);
    border:.5px solid rgba(255,255,255,.7);border-radius:12px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.22);
    display:flex;flex-direction:column;gap:8px;
    animation:atdock-in .18s cubic-bezier(.16,1,.3,1)}
  @keyframes atdock-in{from{opacity:0;transform:translateY(4px) scale(.96)}to{opacity:1;transform:none}}
  .atdock-pop h4{margin:0 0 2px;font-size:10px;font-weight:600;letter-spacing:.06em;
    text-transform:uppercase;color:rgba(41,38,27,.5)}

  .atdock-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06)}
  .atdock-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.95);box-shadow:0 1px 2px rgba(0,0,0,.1);
    transition:left .18s cubic-bezier(.3,.7,.4,1),width .18s}
  .atdock-seg button{position:relative;z-index:1;flex:1;appearance:none;border:0;
    background:transparent;font:inherit;font-weight:500;height:24px;padding:0 10px;
    border-radius:6px;cursor:default;color:rgba(41,38,27,.7);white-space:nowrap}
  .atdock-seg button[aria-checked="true"]{color:#29261b}

  .atdock-check{display:flex;align-items:center;justify-content:space-between;
    padding:4px 2px;gap:10px;cursor:default}
  .atdock-check:hover{background:rgba(0,0,0,.04);border-radius:6px;margin:0 -4px;padding:4px 6px}
  .atdock-check span{font-weight:500;color:rgba(41,38,27,.82)}
  .atdock-check .sw{position:relative;width:26px;height:15px;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;flex-shrink:0}
  .atdock-check .sw i{position:absolute;top:2px;left:2px;width:11px;height:11px;
    border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);
    transition:transform .15s}
  .atdock-check[data-on="1"] .sw{background:#3dd8a8}
  .atdock-check[data-on="1"] .sw i{transform:translateX(11px)}

  .atdock.dark{background:rgba(26,22,18,.82);color:#f5ecde;
    border-color:rgba(255,255,255,.08)}
  .atdock.dark .atdock-handle{color:rgba(245,236,222,.35);border-color:rgba(255,255,255,.06)}
  .atdock.dark .atdock-btn{color:rgba(245,236,222,.7)}
  .atdock.dark .atdock-btn:hover{background:rgba(255,255,255,.08);color:#f5ecde}
  .atdock.dark .atdock-x{color:rgba(245,236,222,.45);border-color:rgba(255,255,255,.06)}
  .atdock.dark .atdock-x:hover{color:#f5ecde;background:rgba(255,255,255,.08)}
  .atdock.dark .atdock-pop{background:rgba(26,22,18,.94);
    border-color:rgba(255,255,255,.08);color:#f5ecde}
  .atdock.dark .atdock-pop h4{color:rgba(245,236,222,.5)}
  .atdock.dark .atdock-seg{background:rgba(255,255,255,.08)}
  .atdock.dark .atdock-seg-thumb{background:rgba(255,255,255,.15)}
  .atdock.dark .atdock-seg button{color:rgba(245,236,222,.6)}
  .atdock.dark .atdock-seg button[aria-checked="true"]{color:#f5ecde}
  .atdock.dark .atdock-check span{color:rgba(245,236,222,.85)}
`;

// ── Icons ─────────────────────────────────────────────────────────────────────

function ThemeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function AxisIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3l-4 4 4 4" />
      <path d="M3 7h18" />
      <path d="M17 13l4 4-4 4" />
      <path d="M21 17H3" />
    </svg>
  );
}

function HorizonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="7" cy="11" r="1.4" fill="currentColor" />
      <circle cx="11" cy="7" r="1.4" fill="currentColor" />
      <circle cx="16" cy="9" r="1.4" fill="currentColor" />
      <circle cx="17" cy="14" r="1.4" fill="currentColor" />
    </svg>
  );
}

function InteractionsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

// ── Segmented control ────────────────────────────────────────────────────────

interface SegOption<T extends string> {
  value: T;
  label: string;
}

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: SegOption<T>[];
  onChange: (v: T) => void;
}) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const n = options.length;
  return (
    <div className="atdock-seg" role="radiogroup">
      <div
        className="atdock-seg-thumb"
        style={{
          left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
          width: `calc((100% - 4px) / ${n})`,
        }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Check({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      className="atdock-check"
      data-on={value ? "1" : "0"}
      onClick={() => onChange(!value)}
      style={{ width: "100%", textAlign: "left" }}
    >
      <span>{label}</span>
      <div className="sw">
        <i />
      </div>
    </button>
  );
}

// ── Popover content ──────────────────────────────────────────────────────────

type Section = "theme" | "axis" | "horizon" | "palette" | "interactions";

function DockContent({
  section,
  prefs,
  onPrefs,
  theme,
  onTheme,
}: {
  section: Section;
  prefs: AssignmentsListPrefs;
  onPrefs: (next: AssignmentsListPrefs) => void;
  theme: string;
  onTheme: (v: "light" | "dark") => void;
}) {
  if (section === "theme") {
    return (
      <>
        <h4>Thema</h4>
        <Seg<"light" | "dark">
          value={theme === "dark" ? "dark" : "light"}
          onChange={onTheme}
          options={[
            { value: "light", label: "Licht" },
            { value: "dark", label: "Donker" },
          ]}
        />
      </>
    );
  }
  if (section === "axis") {
    return (
      <>
        <h4>As</h4>
        <Seg<AssignmentsAxis>
          value={prefs.axis}
          onChange={(v) => onPrefs({ ...prefs, axis: v })}
          options={[
            { value: "people", label: "Per mens" },
            { value: "projects", label: "Per project" },
          ]}
        />
      </>
    );
  }
  if (section === "horizon") {
    return (
      <>
        <h4>Horizon</h4>
        <Seg<AssignmentsHorizon>
          value={prefs.horizon}
          onChange={(v) => onPrefs({ ...prefs, horizon: v })}
          options={[
            { value: "week", label: "Week 6" },
            { value: "month", label: "Maand 16" },
            { value: "quarter", label: "Kwartaal 28" },
          ]}
        />
      </>
    );
  }
  if (section === "palette") {
    return (
      <>
        <h4>Palet</h4>
        <Seg<PaletteName>
          value={prefs.palette}
          onChange={(v) => onPrefs({ ...prefs, palette: v })}
          options={[
            { value: "pastel", label: "Pastel" },
            { value: "pastel-warm", label: "Warm" },
            { value: "pastel-cool", label: "Koel" },
            { value: "role", label: "Rol" },
            { value: "aurora", label: "Aurora" },
          ]}
        />
      </>
    );
  }
  if (section === "interactions") {
    return (
      <>
        <h4>Interacties</h4>
        <Check
          label="Magnetisch (week-snap)"
          value={prefs.magnetic}
          onChange={(v) => onPrefs({ ...prefs, magnetic: v })}
        />
        <Check
          label="Ghost-preview"
          value={prefs.showGhost}
          onChange={(v) => onPrefs({ ...prefs, showGhost: v })}
        />
        <Check
          label="Capaciteits-balk"
          value={prefs.showCapBar}
          onChange={(v) => onPrefs({ ...prefs, showCapBar: v })}
        />
        <Check
          label="Omzet tonen"
          value={prefs.showRevenue}
          onChange={(v) => onPrefs({ ...prefs, showRevenue: v })}
        />
      </>
    );
  }
  return null;
}

// ── Main dock ────────────────────────────────────────────────────────────────

interface AssignmentsTweaksDockProps {
  prefs: AssignmentsListPrefs;
  onChange: (next: AssignmentsListPrefs) => void;
}

export function AssignmentsTweaksDock({
  prefs,
  onChange,
}: AssignmentsTweaksDockProps) {
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const [section, setSection] = useState<Section | null>(null);
  const [pos, setPos] = useState({ right: 20, bottom: 20 });
  const dockRef = useRef<HTMLDivElement>(null);

  const isDark = theme === "dark";

  useEffect(() => {
    if (!section) return;
    const onDown = (e: MouseEvent) => {
      if (!dockRef.current?.contains(e.target as Node)) setSection(null);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [section]);

  if (!mounted) return null;

  function onDragStart(e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const start = { ...pos };
    const move = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = dockRef.current?.offsetWidth ?? 260;
      const h = dockRef.current?.offsetHeight ?? 40;
      setPos({
        right: Math.max(8, Math.min(vw - w - 8, start.right - dx)),
        bottom: Math.max(8, Math.min(vh - h - 8, start.bottom - dy)),
      });
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  const sections: {
    id: Section;
    Icon: () => React.ReactElement;
    label: string;
    dot: string | null;
  }[] = [
    {
      id: "theme",
      Icon: ThemeIcon,
      label: "Thema",
      dot: isDark ? "#7b5cff" : "#f5c55c",
    },
    {
      id: "axis",
      Icon: AxisIcon,
      label: prefs.axis === "people" ? "Per mens" : "Per project",
      dot: prefs.axis === "projects" ? "#7b5cff" : "#3dd8a8",
    },
    {
      id: "horizon",
      Icon: HorizonIcon,
      label: prefs.horizon,
      dot:
        prefs.horizon === "week"
          ? "#3dd8a8"
          : prefs.horizon === "month"
            ? "#4ba3ff"
            : "#7b5cff",
    },
    {
      id: "palette",
      Icon: PaletteIcon,
      label: prefs.palette,
      dot:
        prefs.palette === "aurora"
          ? "#7b5cff"
          : prefs.palette === "role"
            ? "#ff8a4c"
            : "#3dd8a8",
    },
    {
      id: "interactions",
      Icon: InteractionsIcon,
      label: "Interacties",
      dot: prefs.magnetic ? "#3dd8a8" : null,
    },
  ];

  return (
    <>
      <style>{DOCK_CSS}</style>
      <div
        ref={dockRef}
        className={`atdock${section ? " expanded" : ""}${isDark ? " dark" : ""}`}
        style={{ right: pos.right, bottom: pos.bottom }}
      >
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- visual-only drag affordance */}
        <div className="atdock-handle" onMouseDown={onDragStart} title="Versleep">
          <svg viewBox="0 0 6 12" fill="currentColor">
            <circle cx="1.5" cy="2" r="1" />
            <circle cx="4.5" cy="2" r="1" />
            <circle cx="1.5" cy="6" r="1" />
            <circle cx="4.5" cy="6" r="1" />
            <circle cx="1.5" cy="10" r="1" />
            <circle cx="4.5" cy="10" r="1" />
          </svg>
        </div>

        {sections.map((s) => {
          const active = section === s.id;
          return (
            <button
              key={s.id}
              className={`atdock-btn${active ? " on" : ""}`}
              onClick={() => setSection(active ? null : s.id)}
              title={s.label}
            >
              <s.Icon />
              {s.dot && <span className="atdock-dot" style={{ background: s.dot }} />}
            </button>
          );
        })}

        <button
          className="atdock-x"
          onClick={() => setSection(null)}
          title="Sluiten"
        >
          ✕
        </button>

        {section && (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- popover wrapper stops propagation only
          <div className="atdock-pop" onMouseDown={(e) => e.stopPropagation()}>
            <DockContent
              section={section}
              prefs={prefs}
              onPrefs={onChange}
              theme={theme}
              onTheme={(v) => setTheme(v)}
            />
          </div>
        )}
      </div>
    </>
  );
}
