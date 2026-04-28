# Casella Fase 1.7 — Claude Design Handoff Visual Refresh

**Goal:** Integreer de Claude Design handoff (`design handoff 2804/design_handoff_casella_admin/`) — visual refresh van 12 admin + employee schermen — in de bestaande Casella Next.js codebase. Behoud alle 1.6 functionaliteit (server-fetches, API routes, form submits) en swap de UI-laag naar de rijke handoff-designs (paspoort hero-cards, OKLCH-domain accents, Cormorant display + Geist Mono labels).

**Architecture:** Plan 1.7 is **purely visual** — geen schema-changes, geen nieuwe API-routes, geen nieuwe data-fetches. Per pagina:

1. Behoud server-fetched page-component (data-laag uit Plan 1.6)
2. Vervang feature-componenten in `apps/web/features/<domain>/` door handoff-design recreaties
3. Hergebruik bestaande props (LeaveListItem, ExpenseListItem, ContractTimelineItem, BonusHistoryRow, etc.)
4. Voeg nieuwe shared design-primitives toe in `apps/web/components/design/`

**Tech stack delta:** Foundation is grotendeels al klaar (cream/ink CSS-vars in `globals.css`, Geist + Cormorant fonts in `layout.tsx`, design-tokens TS-package). Nieuw nodig:

- OKLCH-domain helper (`oklch(L C ${hue})` → CSS string)
- `HeroPassportCard`, `SealStamp`, `WatermarkGlyph`, `PassportStat`, `BreakdownStat`, `DetailRow`, `ConfettiBurst` primitives

**Bewust niet meegenomen** (deferred):
- TweaksPanel — design-time tool, niet voor production (per README)
- Nieuwe data-aggregaties — projecten-uren/omzet/avatars stubs blijven STUB (zie 1.5-deferrals)
- Multi-variation switcher — kies één variation per pagina (in plan vastgelegd)

---

## Variation choices (per pagina, locked-in)

Plan committeert aan deze variations om scope-creep te voorkomen:

| Page | Handoff variation gekozen | Reden |
|---|---|---|
| Medewerkers | `variation-a.jsx` (table) | Bestaande `/admin/medewerkers` is al een table. Minste delta. |
| Projecten | `projects-variation-d.jsx` (split-view) | Plan 1.5 koos al split-view + charts. Continuiteit. |
| Toewijzingen | `assignments-variation-a.jsx` (magnetic timeline) | Plan 1.5 koos al magnetic timeline. Continuiteit. |
| Uren | `hours-variation-a.jsx` (default+exception model, 5 big blocks) | Default+exception is elegante UX. |
| Verlof | `leave-variation-a.jsx` (employee balance + request) | Volledig voor employee-side. |
| Verzuim | `verzuim-variation-a.jsx` (employee recovery + admin Poortwachter) | Beide kanten in 1 variation. |
| Bonus | (geen variations — `bonus-page.jsx`) | Hero meter + harvest columns. |
| Contract | (geen variations — `contract-page.jsx`) | Paspoort hero + sections + timeline. |
| Loonstroken | (geen variations — `slips-page.jsx`) | Paspoort hero + history + jaaropgaven. |
| Declaraties | (geen variations — `declaraties-page.jsx`) | Drop-zone + receipts as objects. |
| Nieuwe-klant | `nieuwe-klant.jsx` | 1.5 koos al wizard met live preview. |
| Nieuwe-medewerker | `nieuwe-medewerker.jsx` | Coach panel + preview. |

---

## Chapter A — Foundation primitives

### Task 1: OKLCH-domain helper

**File:** `apps/web/lib/design/oklch.ts`

```ts
export const DOMAIN_HUES = {
  cloud: 165,    // personal / contract / primary CTA
  sun: 50,       // vakantiegeld / rijpend
  warm: 25,      // 13e maand / alerts
  harvest: 145,  // bonus klaar / success
  cool: 240,     // onderweg / pending
  spark: 280,    // promotie / contract changes
} as const;
export type DomainHue = keyof typeof DOMAIN_HUES;

export function oklch(l: number, c: number, h: number, alpha?: number): string {
  return alpha != null ? `oklch(${l} ${c} ${h} / ${alpha})` : `oklch(${l} ${c} ${h})`;
}
export const oklchPrimary = (hue: number) => oklch(0.55, 0.18, hue);
export const oklchTinted = (hue: number) => oklch(0.95, 0.06, hue);
export const oklchEmphasis = (hue: number) => oklch(0.35, 0.18, hue);
```

### Task 2: Hero passport-card primitive

**File:** `apps/web/components/design/hero-passport-card.tsx`

Wraps a card with cream gradient + watermark + 3xl rounded + paspoort-shadow. Children = left + right slot.

### Task 3: SealStamp + WatermarkGlyph

**File:** `apps/web/components/design/seal-stamp.tsx` + `watermark-glyph.tsx`

SealStamp: SVG circle met dashed outer ring + textPath rond een cirkel + center label. Color via OKLCH hue prop.
WatermarkGlyph: large Cormorant italic letter, position absolute, low opacity.

### Task 4: PassportStat + BreakdownStat + DetailRow

**File:** `apps/web/components/design/stats.tsx`

PassportStat: mono-label / display-value / sub-line.
BreakdownStat: hue-tinted card met label + value + sub.
DetailRow: clickable line-item met icon / label / pct / diff badge / value.

### Task 5: ConfettiBurst

**File:** `apps/web/components/design/confetti-burst.tsx` (port van `leave-confetti.jsx`)

Trigger via prop (e.g. on leave approval).

### Task 6: Sanity check Chapter A — typecheck + lint groen.

---

## Chapter B — Mijn account (employee-side)

### Task 7: Contract paspoort

`/contract` — `ContractPassport` (left: identity + tenure-stat + jobtitle, right: SealStamp met VAST/Tijdelijk).
Daaronder: section-blocks (work/salary/secondary/leave/clauses) + version timeline.

### Task 8: Loonstroken paspoort + archive

`/loonstroken` — Hero met current-month seal + Cormorant netto-bedrag.
History: vertical archive list met specials marked (vakantiegeld/13e/bonus).
Jaaropgaven section onderaan.

### Task 9: Bonus harvest

`/bonus` — Hero meter "op koers voor €X" met SVG arc + 3 BreakdownStats (rijpend/klaar/onderweg).
Per-project cards met KPI breakdown (billable hours × hourly margin × KPI factor).

### Task 10: Verlof leave-cards + year calendar

`/verlof` — BalanceBars per type + LeaveForm met datum-picker + year calendar grid view.
ConfettiBurst on submit success.

### Task 11: Declaraties drop-zone + receipts

`/declaraties` + `/declaraties/nieuw` — Drop-zone hero met OCR shimmer + km quick-add + receipts as physical objects in stack view.

### Task 12: Sanity check Chapter B — typecheck + lint + build groen.

---

## Chapter C — Day-to-day

### Task 13: Uren default+exception

`/uren` — Week-grid wordt 5 grote blokken (regulier per dag) + slivers voor exceptions (verlof/ziek/feestdag). 1-click submit.

### Task 14: Verzuim curve + Poortwachter

`/verzuim` (employee) + `/admin/verzuim` (admin) — Recovery timeline curve + Wet Poortwachter milestones radar voor admin.

### Task 15: Toewijzingen magnetic timeline polish

`/admin/toewijzingen` — Visual polish van magnetic timeline (1.5 was eerste iteratie). OKLCH role-palette.

### Task 16: Sanity check Chapter C — typecheck + lint + build groen.

---

## Chapter D — Management

### Task 17: Medewerkers table polish

`/admin/medewerkers` — Refined-table polish (al deels in 1.1b, 1.5). OKLCH avatar colors, status pills, Cormorant column.

### Task 18: Projecten split-view polish

`/admin/projecten` — Split-view + charts (1.5 baseline). Update kaart-panel met paspoort-stijl + OKLCH-tint per status.

### Task 19: Nieuwe-klant wizard polish

`/admin/klanten/nieuw` (intercepting) — Wizard met live preview-kaart + KvK-lookup + tip-of-the-step coach copy.

### Task 20: Nieuwe-medewerker wizard polish

`/admin/medewerkers/nieuw` (intercepting) — Coach panel + preview employee record.

### Task 21: Sanity check Chapter D — typecheck + lint + build + tests groen.

---

## Chapter E — Wrap

### Task 22: Final sanity + deferred-work bookkeeping

Append entry naar `docs/sanity-check-log.md`. Documenteer eventuele deferrals (bv. confetti-animatie polish, copy-finetuning).

### Task 23: PR + squash-merge

Push, open PR, wait for CI, squash-merge.

---

## Anti-patterns te vermijden

- ❌ TweaksPanel mee shippen — design-time tool
- ❌ Mock data uit handoff-files plakken — gebruik real server-fetches uit 1.6
- ❌ Schema-changes — 1.7 is purely visual
- ❌ Nieuwe API-routes — bestaande routes blijven onveranderd
- ❌ Multi-variation switcher in production — kies één variation per pagina
- ❌ `window.foo = bar` patterns uit handoff — gebruik proper imports
- ❌ Tailwind utility colors zoals `bg-blue-500` — alleen CSS-vars + OKLCH

## Build sequence per chapter

Per task:
1. Read handoff-file (e.g. `bonus-hero.jsx`)
2. Lees bestaande page (e.g. `apps/web/features/bonus/employee/bonus-summary.tsx`)
3. Recreëer als TypeScript React component met real props
4. typecheck → lint → indien UI-task: visueel-smoke (manueel)
5. Commit per task

## Verwachte effort

~3-5u focused work, 17 task-commits + 4 sanity + 1 PR-merge. Vergelijkbaar met 1.5 (PR #8) maar 4× zo groot in scope.
