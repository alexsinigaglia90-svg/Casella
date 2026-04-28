# Casella Fase 1.7 — Design Handoff Spec

**Status**: actief — handoff geleverd 2026-04-28 in `design handoff 2804/design_handoff_casella_admin/` (70+ files, 12 schermen).

## Visie

Casella krijgt een visual refresh van het volledige platform van een "AAA admin shell" (Plan 1.5 baseline) naar een **warm, editorial, paspoort-stijl** ervaring. De handoff legt een hele design-sleutel:

- **Cream + ink** als brand-identiteit (geen generic gray/white admin)
- **Cormorant italic** displays + **Geist Sans** body + **Geist Mono** labels
- **OKLCH-based domain accents** — perceptually consistent hues per domein (cloud/sun/warm/harvest/cool/spark)
- **Paspoort-stijl hero-cards** voor "Mijn account" (Contract/Bonus/Loonstroken)
- **Watermark glyphs** + **seal stamps** met SVG textPath
- **Confetti** op positive milestones
- **Numbers as art** — tabular-nums + Cormorant-italic large numbers

## Doel

Het platform voelt minder "softwarematig" en meer als een persoonlijk arbeidsdocument. Voor employees: hun bonus, contract, en loonstroken zien eruit als hoogwaardige PDF-paspoorten. Voor admins: de tools voelen meer als craft dan als CRUD.

## Scope

12 schermen visueel refreshen + ~7 nieuwe shared design-primitives. Functionaliteit blijft 100% intact (1.6 features blijven werken). Geen schema-changes, geen API-changes.

Plan-doc met chapter-overzicht + variation-keuzes: `docs/superpowers/plans/2026-04-28-fase-1-7-design-handoff.md`.

## Out of scope

- TweaksPanel (design-time tool)
- Nieuwe data-aggregaties (Fase 1.5-stubs blijven STUB)
- Email-template HTML-redesign (deferred A1 — EMAIL-COPY-ADDENDUM)
- Mobile RN consumer-side van de design tokens (Fase 3)

## Acceptance criteria

- 12 schermen visueel matchen handoff variations (gekozen per pagina in plan-doc)
- Cream/ink/OKLCH styling consistent — geen Tailwind utility colors voor domain-accents
- Cormorant italic emphasis + Geist Mono labels overal
- Tests + lint + build groen
- Geen functional regressions op 1.6 features (verlof submitten, declaratie indienen, etc.)
- Pre-PR sanity-check log entry

## Bronnen

- Handoff: `design handoff 2804/design_handoff_casella_admin/README.md` (251 regels)
- 70+ JSX files + 12 HTML preview-pages
- Foundation: `apps/web/app/globals.css` (cream-vars al), `apps/web/app/layout.tsx` (Geist+Cormorant), `packages/design-tokens/src/` (TS source-of-truth)
