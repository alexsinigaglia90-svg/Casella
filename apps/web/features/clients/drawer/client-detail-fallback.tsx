"use client";

import type { ClientWithAddress } from "@casella/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ClientWizard } from "./wizard/client-wizard";

/**
 * Full-page fallback for direct-link / share / refresh of
 * `/admin/klanten/[id]` when the intercepting `@modal/(.)[id]` slot did
 * not catch the navigation (i.e. there is no list mounted underneath).
 *
 * Renders the same `<ClientWizard mode="edit">` as the drawer overlay so
 * functional parity is preserved — only the chrome differs.
 */
export function ClientDetailFallback({
  client,
}: {
  client: ClientWithAddress;
}) {
  const router = useRouter();
  return (
    <div className="container mx-auto max-w-[820px] py-12 px-6">
      <Link
        href="/admin/klanten"
        className="text-sm hover:underline"
        style={{ color: "var(--fg-tertiary)" }}
      >
        ← Terug naar overzicht
      </Link>
      <h1 className="font-display mt-4 mb-8" style={{ fontSize: "1.6rem" }}>
        {client.name}
      </h1>
      <div
        className="rounded-lg overflow-hidden"
        style={{
          background: "var(--surface-lift)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <ClientWizard
          mode="edit"
          client={client}
          onClose={() => router.push("/admin/klanten")}
          onSaved={() => router.refresh()}
        />
      </div>
    </div>
  );
}
