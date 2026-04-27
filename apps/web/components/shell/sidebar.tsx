"use client";

import type { LucideIcon } from "lucide-react";
import {
  Users,
  Briefcase,
  Folders,
  UserCheck,
  Home,
  FileText,
  Clock,
  Calendar,
  Wallet,
  Activity,
  HeartPulse,
  Receipt,
  Trophy,
  PieChart,
  FileBadge,
  User,
  Megaphone,
  ScrollText,
  Inbox,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Brand } from "./brand";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { FavoritesSection } from "@/features/admin-shell/pins/favorites-section";
import type { CurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";

interface NavLink {
  href: Route;
  label: string;
  icon: LucideIcon;
}

const EMPLOYEE_LINKS: NavLink[] = [
  { href: "/dashboard" as Route, label: "Dashboard", icon: Home },
  { href: "/uren" as Route, label: "Uren", icon: Clock },
  { href: "/verlof" as Route, label: "Verlof", icon: Calendar },
  { href: "/verzuim" as Route, label: "Verzuim", icon: HeartPulse },
  { href: "/declaraties" as Route, label: "Declaraties", icon: Receipt },
  { href: "/contract" as Route, label: "Contract", icon: FileText },
  { href: "/loonstroken" as Route, label: "Loonstroken", icon: Wallet },
  { href: "/bonus" as Route, label: "Bonus", icon: Trophy },
  { href: "/winstdeling" as Route, label: "Winstdeling", icon: PieChart },
  { href: "/werkgeversverklaring" as Route, label: "Werkgeversverklaring", icon: FileBadge },
  { href: "/profiel" as Route, label: "Profiel", icon: User },
];

const ADMIN_LINKS: NavLink[] = [
  { href: "/admin/dashboard" as Route, label: "Dashboard", icon: Home },
  { href: "/admin/medewerkers" as Route, label: "Medewerkers", icon: Users },
  { href: "/admin/klanten" as Route, label: "Klanten", icon: Briefcase },
  { href: "/admin/projecten" as Route, label: "Projecten", icon: Folders },
  { href: "/admin/toewijzingen" as Route, label: "Toewijzingen", icon: UserCheck },
  { href: "/admin/uren" as Route, label: "Uren goedkeuren", icon: Clock },
  { href: "/admin/verlof" as Route, label: "Verlof goedkeuren", icon: Calendar },
  { href: "/admin/verzuim" as Route, label: "Verzuim", icon: HeartPulse },
  { href: "/admin/declaraties" as Route, label: "Declaraties", icon: Receipt },
  { href: "/admin/contracten" as Route, label: "Contracten", icon: ScrollText },
  { href: "/admin/bonus" as Route, label: "Bonus-beheer", icon: Trophy },
  { href: "/admin/broadcasts" as Route, label: "Berichten", icon: Megaphone },
  { href: "/admin/change-requests" as Route, label: "Wijzigingsverzoeken", icon: Inbox },
  { href: "/admin/nmbrs" as Route, label: "Nmbrs sync", icon: Activity },
];

export function Sidebar({ user, mode }: { user: CurrentUser; mode: "employee" | "admin" }) {
  const pathname = usePathname();
  const links = mode === "admin" ? ADMIN_LINKS : EMPLOYEE_LINKS;

  return (
    <nav className="flex h-screen w-64 flex-col border-r border-border glass">
      <div className="flex items-center p-4">
        <Brand />
      </div>

      {mode === "admin" && <FavoritesSection />}

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
                    ? "bg-surface-base shadow-sm text-fg-primary"
                    : "text-fg-secondary hover:bg-surface-lift hover:text-fg-primary"
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

      <div className="border-t border-border p-3">
        <ThemeToggle />
      </div>
    </nav>
  );
}
