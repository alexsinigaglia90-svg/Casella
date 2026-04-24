"use client";

import React, { useState, useRef, useEffect } from "react";
import type { ListPrefs, Density, StatusVariant } from "@/lib/list-prefs-cookie-shared";
import { useTheme } from "@/lib/use-theme";

// Defer mounting until after hydration so theme cookie (read client-side via
// useTheme) cannot diverge from the server's "system" default and trip the
// React hydration check on aria-checked / dot color attributes.
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

const DOCK_CSS = `
  .tdock{position:fixed;z-index:2147483646;display:flex;align-items:stretch;gap:0;
    padding:4px;background:rgba(250,249,247,.82);
    -webkit-backdrop-filter:blur(28px) saturate(160%);backdrop-filter:blur(28px) saturate(160%);
    border:.5px solid rgba(255,255,255,.7);border-radius:999px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 10px 32px rgba(0,0,0,.18);
    font:11px/1 ui-sans-serif,system-ui,-apple-system,sans-serif;
    color:#29261b;user-select:none;
    transition:border-radius .22s cubic-bezier(.16,1,.3,1);
  }
  .tdock.expanded{border-radius:18px}
  .tdock-handle{display:flex;align-items:center;justify-content:center;
    width:28px;cursor:move;color:rgba(41,38,27,.35);
    border-right:.5px solid rgba(0,0,0,.06);margin-right:2px}
  .tdock-handle svg{width:10px;height:14px}
  .tdock-btn{position:relative;appearance:none;border:0;background:transparent;
    width:32px;height:32px;border-radius:999px;cursor:default;
    display:flex;align-items:center;justify-content:center;color:rgba(41,38,27,.7);
    transition:background .15s,color .15s}
  .tdock-btn:hover{background:rgba(0,0,0,.06);color:#29261b}
  .tdock-btn.on{background:rgba(123,92,255,.12);color:#7b5cff}
  .tdock-btn svg{width:15px;height:15px}
  .tdock-dot{position:absolute;bottom:4px;right:4px;width:6px;height:6px;
    border-radius:50%;border:1.5px solid rgba(250,249,247,.95)}
  .tdock-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.4);
    width:24px;height:32px;border-radius:999px;cursor:default;font-size:12px;
    margin-left:2px;border-left:.5px solid rgba(0,0,0,.06)}
  .tdock-x:hover{color:#29261b;background:rgba(0,0,0,.06)}

  .tdock-pop{position:absolute;bottom:calc(100% + 8px);right:0;min-width:200px;
    padding:10px 12px;background:rgba(250,249,247,.92);
    -webkit-backdrop-filter:blur(28px) saturate(160%);backdrop-filter:blur(28px) saturate(160%);
    border:.5px solid rgba(255,255,255,.7);border-radius:12px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.22);
    display:flex;flex-direction:column;gap:8px;
    animation:tdock-in .18s cubic-bezier(.16,1,.3,1)}
  @keyframes tdock-in{from{opacity:0;transform:translateY(4px) scale(.96)}to{opacity:1;transform:none}}
  .tdock-pop h4{margin:0 0 2px;font-size:10px;font-weight:600;letter-spacing:.06em;
    text-transform:uppercase;color:rgba(41,38,27,.5)}

  .tdock-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06)}
  .tdock-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.95);box-shadow:0 1px 2px rgba(0,0,0,.1);
    transition:left .18s cubic-bezier(.3,.7,.4,1),width .18s}
  .tdock-seg button{position:relative;z-index:1;flex:1;appearance:none;border:0;
    background:transparent;font:inherit;font-weight:500;height:24px;padding:0 10px;
    border-radius:6px;cursor:default;color:rgba(41,38,27,.7);white-space:nowrap}
  .tdock-seg button[aria-checked="true"]{color:#29261b}

  .tdock-check{display:flex;align-items:center;justify-content:space-between;
    padding:4px 2px;gap:10px;cursor:default}
  .tdock-check:hover{background:rgba(0,0,0,.04);border-radius:6px;margin:0 -4px;padding:4px 6px}
  .tdock-check span{font-weight:500;color:rgba(41,38,27,.82)}
  .tdock-check .sw{position:relative;width:26px;height:15px;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;flex-shrink:0}
  .tdock-check .sw i{position:absolute;top:2px;left:2px;width:11px;height:11px;
    border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);
    transition:transform .15s}
  .tdock-check[data-on="1"] .sw{background:#3dd8a8}
  .tdock-check[data-on="1"] .sw i{transform:translateX(11px)}

  .tdock.dark{background:rgba(26,22,18,.82);color:#f5ecde;
    border-color:rgba(255,255,255,.08)}
  .tdock.dark .tdock-handle{color:rgba(245,236,222,.35);border-color:rgba(255,255,255,.06)}
  .tdock.dark .tdock-btn{color:rgba(245,236,222,.7)}
  .tdock.dark .tdock-btn:hover{background:rgba(255,255,255,.08);color:#f5ecde}
  .tdock.dark .tdock-x{color:rgba(245,236,222,.45);border-color:rgba(255,255,255,.06)}
  .tdock.dark .tdock-x:hover{color:#f5ecde;background:rgba(255,255,255,.08)}
  .tdock.dark .tdock-pop{background:rgba(26,22,18,.94);
    border-color:rgba(255,255,255,.08);color:#f5ecde}
  .tdock.dark .tdock-pop h4{color:rgba(245,236,222,.5)}
  .tdock.dark .tdock-seg{background:rgba(255,255,255,.08)}
  .tdock.dark .tdock-seg-thumb{background:rgba(255,255,255,.15)}
  .tdock.dark .tdock-seg button{color:rgba(245,236,222,.6)}
  .tdock.dark .tdock-seg button[aria-checked="true"]{color:#f5ecde}
  .tdock.dark .tdock-check span{color:rgba(245,236,222,.85)}
`;

// ── Icon components ──────────────────────────────────────────────────────────

function DensityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function StatusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function AvatarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function ColumnsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="4" height="16" rx="1" />
      <rect x="10" y="4" width="4" height="16" rx="1" />
      <rect x="17" y="4" width="4" height="16" rx="1" />
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
    <div className="tdock-seg" role="radiogroup">
      <div
        className="tdock-seg-thumb"
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

// ── Toggle row ───────────────────────────────────────────────────────────────

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
      className="tdock-check"
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

type Section = "density" | "theme" | "status" | "avatars" | "cols";

function DockContent({
  section,
  prefs,
  onPrefs,
  theme,
  onTheme,
}: {
  section: Section;
  prefs: ListPrefs;
  onPrefs: (next: ListPrefs) => void;
  theme: string;
  onTheme: (v: "light" | "dark") => void;
}) {
  if (section === "density") {
    return (
      <>
        <h4>Dichtheid</h4>
        <Seg<Density>
          value={prefs.density}
          onChange={(v) => onPrefs({ ...prefs, density: v })}
          options={[
            { value: "compact", label: "Compact" },
            { value: "comfortable", label: "Comfort" },
            { value: "spacious", label: "Ruim" },
          ]}
        />
      </>
    );
  }
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
  if (section === "status") {
    return (
      <>
        <h4>Status-stijl</h4>
        <Seg<StatusVariant>
          value={prefs.statusVariant}
          onChange={(v) => onPrefs({ ...prefs, statusVariant: v })}
          options={[
            { value: "pill", label: "Pill" },
            { value: "dot", label: "Dot" },
            { value: "text", label: "Tekst" },
          ]}
        />
      </>
    );
  }
  if (section === "avatars") {
    return (
      <>
        <h4>Avatars</h4>
        <Check
          label="Toon gekleurde avatars"
          value={prefs.showAvatars}
          onChange={(v) => onPrefs({ ...prefs, showAvatars: v })}
        />
      </>
    );
  }
  if (section === "cols") {
    return (
      <>
        <h4>Kolommen</h4>
        <Check
          label="E-mail"
          value={prefs.columns.email}
          onChange={(v) => onPrefs({ ...prefs, columns: { ...prefs.columns, email: v } })}
        />
        <Check
          label="Functie"
          value={prefs.columns.function}
          onChange={(v) => onPrefs({ ...prefs, columns: { ...prefs.columns, function: v } })}
        />
        <Check
          label="Project"
          value={prefs.columns.project}
          onChange={(v) => onPrefs({ ...prefs, columns: { ...prefs.columns, project: v } })}
        />
        <Check
          label="Status"
          value={prefs.columns.status}
          onChange={(v) => onPrefs({ ...prefs, columns: { ...prefs.columns, status: v } })}
        />
        <Check
          label="Startdatum"
          value={prefs.columns.startDate}
          onChange={(v) => onPrefs({ ...prefs, columns: { ...prefs.columns, startDate: v } })}
        />
      </>
    );
  }
  return null;
}

// ── Main dock component ──────────────────────────────────────────────────────

interface ListTweaksDockProps {
  prefs: ListPrefs;
  onChange: (next: ListPrefs) => void;
}

export function ListTweaksDock({ prefs, onChange }: ListTweaksDockProps) {
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const [section, setSection] = useState<Section | null>(null);
  const [pos, setPos] = useState({ right: 20, bottom: 20 });
  const dockRef = useRef<HTMLDivElement>(null);

  const isDark = theme === "dark";

  // Close popover on outside click
  useEffect(() => {
    if (!section) return;
    const onDown = (e: MouseEvent) => {
      if (!dockRef.current?.contains(e.target as Node)) setSection(null);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [section]);

  // Render nothing on the server / before hydration. Must come AFTER all hooks
  // (Rules of Hooks: hook order must be stable across renders).
  // Prevents the segmented aria-checked attribute from diverging between SSR
  // (theme defaults to "system") and client (cookie-driven actual theme).
  if (!mounted) return null;

  // Drag by handle
  function onDragStart(e: React.MouseEvent) {
    e.preventDefault(); // suppress browser text-selection drag that fights our handler
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

  // Accent dot colors
  const densityDot: Record<string, string> = {
    compact: "#ff8a4c",
    comfortable: "#3dd8a8",
    spacious: "#4ba3ff",
  };
  const statusDot: Record<string, string> = {
    pill: "#7b5cff",
    dot: "#3dd8a8",
    text: "#ff8a4c",
  };
  const colCount = [
    prefs.columns.email,
    prefs.columns.function,
    prefs.columns.project,
    prefs.columns.status,
    prefs.columns.startDate,
  ].filter(Boolean).length;

  const sections: {
    id: Section;
    Icon: () => React.ReactElement;
    label: string;
    dot: string | null;
  }[] = [
    {
      id: "density",
      Icon: DensityIcon,
      label: "Dichtheid",
      dot: densityDot[prefs.density] ?? null,
    },
    {
      id: "theme",
      Icon: ThemeIcon,
      label: "Thema",
      dot: isDark ? "#7b5cff" : "#f5c55c",
    },
    {
      id: "status",
      Icon: StatusIcon,
      label: "Status-stijl",
      dot: statusDot[prefs.statusVariant] ?? null,
    },
    {
      id: "avatars",
      Icon: AvatarIcon,
      label: "Avatars",
      dot: prefs.showAvatars ? "#3dd8a8" : null,
    },
    {
      id: "cols",
      Icon: ColumnsIcon,
      label: `Kolommen · ${colCount}/5`,
      dot: colCount === 5 ? null : "#f5c55c",
    },
  ];

  return (
    <>
      <style>{DOCK_CSS}</style>
      <div
        ref={dockRef}
        className={`tdock${section ? " expanded" : ""}${isDark ? " dark" : ""}`}
        style={{ right: pos.right, bottom: pos.bottom }}
      >
        {/* Drag handle */}
        <div className="tdock-handle" onMouseDown={onDragStart} title="Versleep">
          <svg viewBox="0 0 6 12" fill="currentColor">
            <circle cx="1.5" cy="2" r="1" />
            <circle cx="4.5" cy="2" r="1" />
            <circle cx="1.5" cy="6" r="1" />
            <circle cx="4.5" cy="6" r="1" />
            <circle cx="1.5" cy="10" r="1" />
            <circle cx="4.5" cy="10" r="1" />
          </svg>
        </div>

        {/* Icon buttons */}
        {sections.map((s) => {
          const active = section === s.id;
          return (
            <button
              key={s.id}
              className={`tdock-btn${active ? " on" : ""}`}
              onClick={() => setSection(active ? null : s.id)}
              title={s.label}
            >
              <s.Icon />
              {s.dot && <span className="tdock-dot" style={{ background: s.dot }} />}
            </button>
          );
        })}

        {/* Close button — closes popover only, dock stays visible */}
        <button
          className="tdock-x"
          onClick={() => setSection(null)}
          title="Sluiten"
        >
          ✕
        </button>

        {/* Popover */}
        {section && (
          <div className="tdock-pop" onMouseDown={(e) => e.stopPropagation()}>
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
