"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Users, Briefcase, Folders, UserCheck, Home, FileText, Clock, Calendar, Wallet } from "lucide-react";
import { Brand } from "./brand";
import { EnvBadge } from "./env-badge";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/current-user";

interface NavLink {
  href: Route;
  label: string;
  icon: LucideIcon;
}

const EMPLOYEE_LINKS: NavLink[] = [
  { href: "/dashboard" as Route, label: "Dashboard", icon: Home },
  { href: "/uren" as Route, label: "Uren", icon: Clock },
  { href: "/verlof" as Route, label: "Verlof", icon: Calendar },
  { href: "/contract" as Route, label: "Contract", icon: FileText },
  { href: "/loonstroken" as Route, label: "Loonstroken", icon: Wallet },
];

const ADMIN_LINKS: NavLink[] = [
  { href: "/admin/dashboard" as Route, label: "Dashboard", icon: Home },
  { href: "/admin/medewerkers" as Route, label: "Medewerkers", icon: Users },
  { href: "/admin/klanten" as Route, label: "Klanten", icon: Briefcase },
  { href: "/admin/projecten" as Route, label: "Projecten", icon: Folders },
  { href: "/admin/toewijzingen" as Route, label: "Toewijzingen", icon: UserCheck },
];

export function Sidebar({ user, mode }: { user: CurrentUser; mode: "employee" | "admin" }) {
  const pathname = usePathname();
  const links = mode === "admin" ? ADMIN_LINKS : EMPLOYEE_LINKS;

  return (
    <nav className="flex h-screen w-64 flex-col border-r border-border glass">
      <div className="flex items-center justify-between p-4">
        <Brand />
        <EnvBadge />
      </div>

      <ul className="flex-1 space-y-0.5 px-3 py-2">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-quick ease-standard",
                  active
                    ? "bg-surface-base shadow-sm text-text-primary"
                    : "text-text-secondary hover:bg-surface-lift hover:text-text-primary"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {user.role === "admin" && (
        <div className="border-t border-border px-3 py-3">
          <Link
            href={(mode === "admin" ? "/dashboard" : "/admin/dashboard") as Route}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-aurora-violet hover:bg-surface-lift"
          >
            {mode === "admin" ? "← Medewerker-view" : "→ Admin-view"}
          </Link>
        </div>
      )}
    </nav>
  );
}
