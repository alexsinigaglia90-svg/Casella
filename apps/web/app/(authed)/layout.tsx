import type { Route } from "next";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/shell/sidebar";
import { NotificationBellEmployee } from "@/features/notifications/employee/notification-bell-employee";
import { getCurrentEmployee } from "@/lib/current-employee";
import { getCurrentUser } from "@/lib/current-user";

const ONBOARDING_PENDING_ROUTE = "/onboarding-pending" as Route;

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role === "employee") {
    const employee = await getCurrentEmployee();
    if (!employee) redirect(ONBOARDING_PENDING_ROUTE);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} mode="employee" />
      <main className="flex-1 overflow-x-hidden">
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "48px",
            padding: "8px 16px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            background: "var(--surface-base)",
            borderBottom: "1px solid var(--border-subtle)",
            zIndex: 10,
          }}
        >
          <NotificationBellEmployee />
        </div>
        <div className="mx-auto max-w-[1180px] p-8">{children}</div>
      </main>
    </div>
  );
}
