import type { Route } from "next";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/shell/sidebar";
import { BreadcrumbProvider } from "@/features/admin-shell/breadcrumbs/breadcrumb-context";
import { BreadcrumbTrail } from "@/features/admin-shell/breadcrumbs/breadcrumb-trail";
import { TopBar } from "@/features/admin-shell/top-bar/top-bar";
import { getCurrentUser } from "@/lib/current-user";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "admin") redirect("/dashboard" as Route);

  return (
    <BreadcrumbProvider>
      <div className="flex min-h-screen">
        <Sidebar user={user} mode="admin" />
        <div className="flex flex-1 flex-col overflow-x-hidden">
          <TopBar centerSlot={<BreadcrumbTrail />} />
          <main className="flex-1">
            <div className="mx-auto max-w-[1180px] p-8">{children}</div>
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
