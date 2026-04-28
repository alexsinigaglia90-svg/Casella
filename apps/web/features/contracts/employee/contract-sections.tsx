import type { ReactNode } from "react";

import { oklchEmphasis, oklchSubtleBg } from "@/lib/design/oklch";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  meta?: string;
}

function SectionHeader({ eyebrow, title, meta }: SectionHeaderProps) {
  return (
    <div className="mb-5">
      <div
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
          color: "var(--fg-tertiary)",
        }}
      >
        {eyebrow}
      </div>
      <h2
        className="mt-1.5 font-display"
        style={{
          fontSize: 28,
          fontWeight: 500,
          color: "var(--fg-primary)",
        }}
      >
        {title}
      </h2>
      {meta && (
        <div
          className="mt-1"
          style={{ fontSize: 12, color: "var(--fg-tertiary)" }}
        >
          {meta}
        </div>
      )}
    </div>
  );
}

interface PanelProps {
  title: string;
  hue: number;
  children: ReactNode;
  span?: 1 | 2;
}

function Panel({ title, hue, children, span = 1 }: PanelProps) {
  return (
    <div
      className={`rounded-2xl border ${span === 2 ? "md:col-span-2" : ""}`}
      style={{
        borderColor: "var(--border-subtle)",
        background: "var(--surface-card)",
      }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-4"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div
          className="grid size-2 place-items-center rounded-full"
          style={{ background: oklchEmphasis(hue) }}
        />
        <div
          className="font-display"
          style={{
            fontSize: 20,
            fontWeight: 500,
            color: "var(--fg-primary)",
          }}
        >
          {title}
        </div>
      </div>
      <div className="space-y-2.5 px-5 py-4">{children}</div>
    </div>
  );
}

interface RowProps {
  label: string;
  children: ReactNode;
}

function Row({ label, children }: RowProps) {
  return (
    <div
      className="grid items-baseline gap-4"
      style={{ gridTemplateColumns: "150px 1fr", fontSize: 13 }}
    >
      <div
        className="font-mono uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.08em",
          color: "var(--fg-tertiary)",
        }}
      >
        {label}
      </div>
      <div
        className="flex flex-wrap items-baseline gap-x-2"
        style={{ color: "var(--fg-primary)" }}
      >
        {children}
      </div>
    </div>
  );
}

function fmtEur(centsStr: string | null | undefined): string {
  if (!centsStr) return "—";
  const cents = parseFloat(centsStr);
  if (Number.isNaN(cents)) return "—";
  return `€ ${(cents / 100).toFixed(0)}`;
}

function fmtPct(value: string | null | undefined): string {
  if (!value) return "—";
  const num = parseFloat(value);
  if (Number.isNaN(num)) return "—";
  return `${num.toFixed(1).replace(".", ",")}%`;
}

function fmtRate(value: string | null | undefined): string {
  if (!value) return "—";
  const num = parseFloat(value);
  if (Number.isNaN(num)) return "—";
  return `€ ${num.toFixed(2).replace(".", ",")}`;
}

export interface ContractSectionsProps {
  contract: {
    startDate: string;
    endDate: string | null;
    hoursPerWeek: number;
    workdays?: string[];
    workLocation?: string | null;
    flexible?: boolean;
    brutoSalarisMaandCents: string | null;
    vakantietoeslagPct: string | null;
    baselineTariefPerUur: string | null;
    bonusPctBelowBaseline: string | null;
    bonusPctAboveBaseline: string | null;
    maxOverperformancePct: string | null;
    autoStelpostActief: boolean;
    autoStelpostBedragMaand: string | null;
  };
  defaultKmRateCents: number;
}

export function ContractSections({
  contract,
  defaultKmRateCents,
}: ContractSectionsProps) {
  const isVast = contract.endDate == null;
  const tinted = oklchSubtleBg(isVast ? 145 : 50);

  return (
    <section>
      <SectionHeader
        eyebrow="De inhoud"
        title="Wat staat erin"
        meta="Werk, salaris, secundair, verlof en clausules — uit je actieve contract."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel title="Werk & uren" hue={200}>
          <Row label="Uren per week">
            <span className="font-mono tabular-nums">
              {contract.hoursPerWeek}u
            </span>
          </Row>
          <Row label="Werkdagen">
            {contract.workdays && contract.workdays.length > 0
              ? contract.workdays.map((d) => d.toUpperCase()).join(" · ")
              : "ma · di · wo · do · vr"}
          </Row>
          <Row label="Werklocatie">
            {contract.workLocation ?? "Hybride · Casella-kantoor"}
          </Row>
          <Row label="Flexibele uren">
            {contract.flexible == null
              ? "In overleg"
              : contract.flexible
                ? "Ja, in overleg"
                : "Nee"}
          </Row>
        </Panel>

        <Panel title="Salaris & bonus" hue={145}>
          <Row label="Bruto / maand">
            <span
              className="font-display tabular-nums"
              style={{ fontSize: 24, fontWeight: 500 }}
            >
              {fmtEur(contract.brutoSalarisMaandCents)}
            </span>
          </Row>
          <Row label="Vakantiegeld">
            {fmtPct(contract.vakantietoeslagPct)}
          </Row>
          <Row label="Baseline-tarief">
            {fmtRate(contract.baselineTariefPerUur)} / uur
          </Row>
          <Row label="Bonus-pct (onder baseline)">
            {fmtPct(contract.bonusPctBelowBaseline)}
          </Row>
          <Row label="Bonus-pct (boven baseline)">
            {fmtPct(contract.bonusPctAboveBaseline)}
          </Row>
          <Row label="Max overperformance">
            {fmtPct(contract.maxOverperformancePct)}
          </Row>
        </Panel>

        <Panel title="Spullen & vergoedingen" hue={270}>
          <Row label="Reiskosten">
            <span className="font-mono tabular-nums">
              € {(defaultKmRateCents / 100).toFixed(2).replace(".", ",")}
            </span>{" "}
            / km
          </Row>
          <Row label="Auto-stelpost">
            {contract.autoStelpostActief
              ? `Actief — ${fmtRate(contract.autoStelpostBedragMaand)}/maand`
              : "Niet van toepassing"}
          </Row>
          <Row label="Pensioen">PFZW (volgens cao)</Row>
        </Panel>

        <Panel title="Verlof" hue={50}>
          <Row label="Wettelijke vakantie">
            <span className="font-mono tabular-nums">20 dagen</span>{" "}
            <span style={{ color: "var(--fg-tertiary)" }}>
              (4× contracturen)
            </span>
          </Row>
          <Row label="Bovenwettelijk">
            volgens cao / functieschaal
          </Row>
          <Row label="Bijzonder verlof">volgens cao</Row>
        </Panel>

        <Panel title="Beding & geheimhouding" hue={25} span={2}>
          <Row label="Concurrentiebeding">
            volgens cao — niet algemeen van toepassing
          </Row>
          <Row label="Relatiebeding">12 maanden na uitdiensttreding</Row>
          <Row label="Geheimhouding">Ja, voor onbepaalde tijd</Row>
          <Row label="Type contract">
            <span
              className="rounded-full px-2 py-0.5 font-mono uppercase"
              style={{
                fontSize: 9,
                letterSpacing: "0.1em",
                background: tinted,
                color: oklchEmphasis(isVast ? 145 : 50),
              }}
            >
              {isVast ? "Vast" : "Tijdelijk"}
            </span>
          </Row>
        </Panel>
      </div>
    </section>
  );
}
