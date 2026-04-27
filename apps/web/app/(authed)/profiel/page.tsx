import { eq, getDb, schema } from "@casella/db";
import { redirect } from "next/navigation";
import { ExternalLink, ShieldCheck } from "lucide-react";

import { getCurrentEmployee } from "@/lib/current-employee";
import { getCurrentUser } from "@/lib/current-user";
import { PersonalForm, PreferencesForm } from "@/features/profile/profile-form";
import { EmailPreferences } from "@/features/profile/email-preferences";
import { ChangeRequestForm } from "@/features/profile/change-request-form";

export const dynamic = "force-dynamic";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-xl border p-6 space-y-4"
      style={{ background: "var(--surface-base)", borderColor: "var(--border-subtle)" }}
    >
      <h2 className="text-base font-semibold" style={{ color: "var(--fg-primary)" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function ProfielPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const employee = await getCurrentEmployee();
  if (!employee) redirect("/dashboard");

  const db = getDb();

  // Fetch home address if present
  let homeAddress: typeof schema.addresses.$inferSelect | null = null;
  if (employee.homeAddressId) {
    const rows = await db
      .select()
      .from(schema.addresses)
      .where(eq(schema.addresses.id, employee.homeAddressId))
      .limit(1);
    homeAddress = rows[0] ?? null;
  }

  // Fetch theme from users table
  const [userRow] = await db
    .select({ themePreference: schema.users.themePreference })
    .from(schema.users)
    .where(eq(schema.users.id, user.id))
    .limit(1);

  const themePreference = userRow?.themePreference ?? "system";

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--fg-primary)" }}>
          Mijn profiel
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
          {user.displayName} · {user.email}
        </p>
      </header>

      <Section title="Persoonlijk">
        <PersonalForm
          initialPhone={employee.phone}
          initialEmergencyContactName={employee.emergencyContactName}
          initialEmergencyContactPhone={employee.emergencyContactPhone}
        />
      </Section>

      <Section title="Voorkeuren">
        <PreferencesForm
          initialTheme={themePreference}
          initialLanguage={employee.languagePreference}
          initialBio={employee.bio}
          initialAvatarStoragePath={employee.avatarStoragePath}
        />
      </Section>

      <Section title="Adres">
        {homeAddress ? (
          <div className="space-y-2">
            <p className="text-sm" style={{ color: "var(--fg-primary)" }}>
              {homeAddress.fullAddressDisplay ??
                `${homeAddress.street} ${homeAddress.houseNumber}, ${homeAddress.postalCode} ${homeAddress.city}`}
            </p>
            <ChangeRequestForm type="address" />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm" style={{ color: "var(--fg-tertiary)" }}>
              Geen adres geregistreerd.
            </p>
            <ChangeRequestForm type="address" />
          </div>
        )}
      </Section>

      <Section title="Bank (IBAN)">
        <p className="text-sm" style={{ color: "var(--fg-secondary)" }}>
          IBAN is niet zichtbaar in Casella v1. Je kunt wel een wijzigingsverzoek indienen — de
          admin verwerkt het en Nmbrs-koppeling volgt in Fase 2.
        </p>
        <ChangeRequestForm type="iban" />
      </Section>

      <Section title="E-mail meldingen">
        <p className="text-sm mb-4" style={{ color: "var(--fg-secondary)" }}>
          Kies voor welke events je een e-mail ontvangt. Uit = alleen in-app melding.
        </p>
        <EmailPreferences initialPrefs={employee.emailNotificationPreferences as Record<string, boolean>} />
      </Section>

      <Section title="Beveiliging (2FA)">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--aurora-violet)" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
              Beheerd via Microsoft Entra ID
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--fg-secondary)" }}>
              Inloggen en twee-stapsverificatie lopen via je Microsoft-account. Beheer je
              beveiligingsinfo via de Microsoft-portal.
            </p>
            <a
              href="https://mysignins.microsoft.com/security-info"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm"
              style={{ color: "var(--aurora-violet)" }}
            >
              Beveiligingsinfo beheren
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </Section>
    </div>
  );
}
