import type { Route } from "next";
import { redirect } from "next/navigation";

import { CommandPalette } from "@/components/command-palette/command-palette";
import { EnvBadge } from "@/components/shell/env-badge";
import { Sidebar } from "@/components/shell/sidebar";
import { EmployeeListCacheProvider } from "@/features/admin-shell/breadcrumb-switcher/employee-list-cache-context";
import { BreadcrumbProvider } from "@/features/admin-shell/breadcrumbs/breadcrumb-context";
import { BreadcrumbTrail } from "@/features/admin-shell/breadcrumbs/breadcrumb-trail";
import { PaletteProvider } from "@/features/admin-shell/command-palette/palette-context";
import { CommandPill } from "@/features/admin-shell/command-pill/command-pill";
import { ContextActions } from "@/features/admin-shell/context-actions/context-actions";
import { TopBarActionsProvider } from "@/features/admin-shell/context-actions/context-actions-context";
import { NotificationBell } from "@/features/admin-shell/notifications/notification-bell";
import { QuickCreateProvider } from "@/features/admin-shell/quick-create/quick-create-context";
import { ShortcutsDialog } from "@/features/admin-shell/shortcuts-overlay/shortcuts-dialog";
import { ShortcutsOverlayProvider } from "@/features/admin-shell/shortcuts-overlay/use-shortcuts-overlay";
import { TopBar } from "@/features/admin-shell/top-bar/top-bar";
import { UserMenu } from "@/features/admin-shell/user-menu/user-menu";
import { getCurrentUser } from "@/lib/current-user";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "admin") redirect("/dashboard" as Route);

  return (
    <BreadcrumbProvider>
      <EmployeeListCacheProvider>
      <PaletteProvider>
        <TopBarActionsProvider>
          <QuickCreateProvider>
          <ShortcutsOverlayProvider>
          <div className="flex min-h-screen">
            <Sidebar user={user} mode="admin" />
            <div className="flex flex-1 flex-col overflow-x-hidden">
              <TopBar
                centerSlot={
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                    <BreadcrumbTrail />
                    <ContextActions />
                  </div>
                }
                rightSlot={
                  <>
                    <CommandPill />
                    <NotificationBell />
                    <EnvBadge />
                    <UserMenu displayName={user.displayName} email={user.email} />
                  </>
                }
              />
              <main className="flex-1">
                <div className="mx-auto max-w-[1180px] p-8">{children}</div>
              </main>
            </div>
            <CommandPalette />
            <ShortcutsDialog />
          </div>
          </ShortcutsOverlayProvider>
          </QuickCreateProvider>
        </TopBarActionsProvider>
      </PaletteProvider>
      </EmployeeListCacheProvider>
    </BreadcrumbProvider>
  );
}
