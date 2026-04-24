# Casella — Sanity Check Protocol

Two standing checks. Run them at fixed cadences; also when anything feels slipping.

## When to run

- **End of each sub-phase** (after Task 7 / 13 / 17 / 20 / 25 / 31 within a plan) — takes 5 min, catches drift early.
- **Before opening a PR to main** — mandatory gate.
- **Before starting a new plan** (1.1b, 1.2, etc).
- **On user request** ("sanity check").

## Check 1 — State of health (objective)

Run these commands and report results. **Fail = investigate, do not continue.**

```bash
# 1. Clean tree + commits ahead
git status
git log --oneline main..HEAD | wc -l

# 2. Types — all workspaces
pnpm -r typecheck

# 3. Tests — all workspaces
pnpm -r test -- --run

# 4. Production build (surfaces what dev doesn't)
pnpm -F @casella/web build

# 5. DB migration state
docker exec -i supabase_db_Casella psql -U postgres -d postgres \
  -c "SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id;"

# 6. CI status (after pushing)
gh run list --branch $(git branch --show-current) --limit 3
```

**Pass criteria**:
- Working tree clean
- All typechecks exit 0
- All existing tests pass (no regressions since Fase 0 baseline of 21)
- Production build succeeds
- Migration count in DB matches file count in `packages/db/drizzle/*.sql`
- CI green on latest push

**Record**: add one-line entry to `docs/sanity-check-log.md` (create if missing): date, HEAD SHA, green/yellow/red, anomalies.

## Check 2 — Mobile alignment (judgment)

Read `docs/casella-deferred-work.md` section **Mobile-alignment**. For each open item:

1. **Has the pickup trigger fired?** (e.g. "Start of Plan 1.1b" — are we there?)
2. **Have new tasks since last check made the item cheaper or more expensive?** (e.g. did we build 3 more Server Actions and now migration cost is higher?)
3. **Did we accidentally widen the misalignment?** (e.g. new component imports from web-only source that mobile will need)

**Output**: short verdict per item — `no change` / `advance to in-progress` / `escalate` / `close as obsolete`.

## Adding new deferred items

Whenever a code review flags a non-blocking issue OR a design decision locks in future work, add an entry to `docs/casella-deferred-work.md` with full metadata (Category / Why / Pickup trigger / Cost / Impact). **If it's not in that file, it's not tracked.**

## Anti-patterns (don't do this)

- Don't skip the production build — it catches class-collision, env-var, and RSC-serialization bugs dev doesn't.
- Don't re-run only the check you think will pass; run all six commands.
- Don't mark a deferred item `done` without linking a commit SHA.
- Don't accept "close enough" on typecheck — any error is a red.
