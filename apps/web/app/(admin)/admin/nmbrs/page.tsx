import { hasCredentials } from "@casella/nmbrs";
import { AlertTriangle, Calendar, Clock, Users } from "lucide-react";

import { NmbrsCrumbs } from "@/features/nmbrs/nmbrs-crumbs";
import { NmbrsPageActions } from "@/features/nmbrs/nmbrs-page-actions";
import { SyncCard } from "@/features/nmbrs/sync-card";
import { SyncRunsTable } from "@/features/nmbrs/sync-runs-table";
import { getLatestSyncByType, listSyncRuns } from "@/lib/nmbrs/queries";

export const dynamic = "force-dynamic";

export default async function NmbrsAdminPage() {
  const [latest, runs] = await Promise.all([
    getLatestSyncByType(),
    listSyncRuns(30),
  ]);

  const credsOk = hasCredentials();
  const disabledReason =
    "Configureer NMBRS_USER, NMBRS_TOKEN en NMBRS_COMPANY_ID in .env.local";

  return (
    <>
      <NmbrsCrumbs />
      <NmbrsPageActions />
      <div className="space-y-6">
        <header className="space-y-2">
          <div
            className="mb-1 font-mono text-[11px] uppercase tracking-wider"
            style={{ color: "var(--fg-tertiary)" }}
          >
            Admin
          </div>
          <h1 className="font-display text-display leading-none">
            <span>Nmbrs </span>
            <em>sync</em>
          </h1>
          <p
            className="mt-2 max-w-2xl text-sm"
            style={{ color: "var(--fg-secondary)" }}
          >
            Trigger handmatig een sync met Nmbrs. Medewerkers worden uit Nmbrs
            gehaald, goedgekeurde uren worden ingestuurd en verlof volgt in een
            volgende fase.
          </p>
        </header>

        {!credsOk && (
          <div
            className="flex items-start gap-3 rounded-xl border p-4 glass-card"
            style={{
              borderColor:
                "color-mix(in oklab, var(--danger-fg, #dc2626) 30%, var(--border-subtle))",
            }}
          >
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0"
              style={{ color: "var(--danger-fg, #dc2626)" }}
              aria-hidden
            />
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--fg-primary)" }}
              >
                Niet geconfigureerd
              </p>
              <p
                className="mt-0.5 text-xs"
                style={{ color: "var(--fg-secondary)" }}
              >
                {disabledReason}. De sync-knoppen blijven uitgeschakeld tot de
                credentials beschikbaar zijn.
              </p>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SyncCard
            type="employees"
            title="Medewerkers"
            description="Importeer medewerkers vanuit Nmbrs (pull)."
            icon={Users}
            lastRun={latest.employees}
            enabled={credsOk}
            disabledReason={disabledReason}
          />
          <SyncCard
            type="hours"
            title="Goedgekeurde uren"
            description="Verstuur goedgekeurde uren naar Nmbrs (push)."
            icon={Clock}
            lastRun={latest.hours}
            enabled={credsOk}
            disabledReason={disabledReason}
          />
          <SyncCard
            type="leave"
            title="Verlof / ziekte"
            description="Verlof + ziekteregels naar Nmbrs (push) — volgt in fase 1.4."
            icon={Calendar}
            lastRun={latest.leave}
            enabled={credsOk}
            disabledReason={disabledReason}
          />
        </section>

        <section className="space-y-2">
          <h2
            className="font-mono text-[11px] uppercase tracking-wider"
            style={{ color: "var(--fg-tertiary)" }}
          >
            Historie ({runs.length})
          </h2>
          <SyncRunsTable rows={runs} />
        </section>
      </div>
    </>
  );
}
