import Link from "next/link";
import type { Route } from "next";
import { SignOutButton } from "./sign-out-button";
import type { CurrentUser } from "@/lib/current-user";

const LINKS: { href: Route; label: string }[] = [
  { href: "/dashboard" as Route, label: "Dashboard" },
  { href: "/uren" as Route, label: "Uren" },
  { href: "/verlof" as Route, label: "Verlof" },
  { href: "/verzuim" as Route, label: "Verzuim" },
  { href: "/contract" as Route, label: "Contract" },
  { href: "/loonstroken" as Route, label: "Loonstroken" },
  { href: "/bonus" as Route, label: "Bonus" },
  { href: "/werkgeversverklaring" as Route, label: "Werkgeversverklaring" },
  { href: "/profiel" as Route, label: "Profiel" },
];

export function NavEmployee({ user }: { user: CurrentUser }) {
  return (
    <nav className="w-64 border-r border-border bg-muted/30 p-4 flex flex-col">
      <div className="font-bold text-xl mb-6">Casella</div>
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
        {user.role === "admin" && (
          <li className="pt-4 mt-4 border-t border-border">
            <Link
              href={"/admin/dashboard" as Route}
              className="block px-3 py-2 rounded-md hover:bg-accent text-sm font-medium"
            >
              → Admin
            </Link>
          </li>
        )}
      </ul>
      <div className="pt-4 border-t border-border space-y-2">
        <div className="text-xs text-muted-foreground">{user.displayName}</div>
        <SignOutButton />
      </div>
    </nav>
  );
}
