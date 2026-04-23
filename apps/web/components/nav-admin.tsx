import Link from "next/link";
import type { Route } from "next";
import { SignOutButton } from "./sign-out-button";
import type { CurrentUser } from "@/lib/current-user";

const LINKS: { href: Route; label: string }[] = [
  { href: "/admin/dashboard" as Route, label: "Dashboard" },
  { href: "/admin/medewerkers" as Route, label: "Medewerkers" },
  { href: "/admin/klanten" as Route, label: "Klanten" },
  { href: "/admin/projecten" as Route, label: "Projecten" },
  { href: "/admin/goedkeuringen" as Route, label: "Goedkeuringen" },
  { href: "/admin/werkgeversverklaringen" as Route, label: "Werkgeversverklaringen" },
  { href: "/admin/bonus" as Route, label: "Bonus" },
];

export function NavAdmin({ user }: { user: CurrentUser }) {
  return (
    <nav className="w-64 border-r border-border bg-primary/5 p-4 flex flex-col">
      <div className="font-bold text-xl mb-6">
        Casella <span className="text-xs text-muted-foreground">admin</span>
      </div>
      <ul className="space-y-1 flex-1">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block px-3 py-2 rounded-md hover:bg-accent text-sm"
            >
              {l.label}
            </Link>
          </li>
        ))}
        <li className="pt-4 mt-4 border-t border-border">
          <Link
            href={"/dashboard" as Route}
            className="block px-3 py-2 rounded-md hover:bg-accent text-sm"
          >
            ← Terug naar medewerker-view
          </Link>
        </li>
      </ul>
      <div className="pt-4 border-t border-border space-y-2">
        <div className="text-xs text-muted-foreground">{user.displayName}</div>
        <SignOutButton />
      </div>
    </nav>
  );
}
