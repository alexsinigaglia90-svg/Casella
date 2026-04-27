// apps/web/app/(admin)/admin/medewerkers/pending/page.tsx
import { getDb, sql } from "@casella/db";

import { PendingCrumbs } from "@/features/employees/pending/pending-crumbs";

interface PendingRow extends Record<string, unknown> {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export default async function PendingOnboardingPage() {
  const db = getDb();
  // Users without an employees row (possibly never onboarded, typo, etc.)
  const result = await db.execute<PendingRow>(sql`
    SELECT u.id, u.email, u.display_name, u.created_at
    FROM users u
    LEFT JOIN employees e ON e.user_id = u.id
    WHERE e.id IS NULL AND u.role = 'employee'
    ORDER BY u.created_at DESC
    LIMIT 100
  `);
  const list = [...result];

  return (
    <div className="space-y-6">
      <PendingCrumbs />
      <header>
        <h1 className="font-display text-display">
          <em>Pending</em> onboarding
        </h1>
        <p className="mt-1 text-sm text-fg-secondary">
          Users die zijn ingelogd maar nog geen employee-record hebben.
        </p>
      </header>

      <div className="rounded-lg border border-border glass-card">
        {list.length === 0 ? (
          <p className="p-6 text-sm text-fg-secondary">Niemand wacht op onboarding.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-fg-tertiary">
              <tr>
                <th className="p-3 text-left">Naam</th>
                <th className="p-3 text-left">E-mail</th>
                <th className="p-3 text-left">Eerste login</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="p-3">{r.display_name}</td>
                  <td className="p-3 font-mono text-xs">{r.email}</td>
                  <td className="p-3 font-mono text-xs tabular-nums">
                    {new Date(r.created_at).toLocaleDateString("nl-NL")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
