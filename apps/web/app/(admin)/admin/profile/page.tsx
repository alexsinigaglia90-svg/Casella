import { ProfileCrumbs } from "@/features/admin-shell/user-menu/profile-crumbs";

export default function ProfilePage() {
  return (
    <>
      <ProfileCrumbs />
      <div
        className="rounded-xl p-12 text-center"
        style={{
          border: "1px solid var(--border-subtle)",
          background: "var(--surface-lift)",
        }}
      >
        <h1
          className="font-display mb-2"
          style={{ fontSize: "1.6rem", color: "var(--fg-primary)" }}
        >
          Mijn profiel
        </h1>
        <p style={{ color: "var(--fg-tertiary)" }}>
          Deze pagina komt in Fase 1.2.
          <br />
          Voor nu: theme-voorkeur stel je in via de zijbalk; afmelden via het menu rechtsboven.
        </p>
      </div>
    </>
  );
}
