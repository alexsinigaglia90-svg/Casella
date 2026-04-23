import { redirect } from "next/navigation";
import type { Route } from "next";
import { getCurrentUser } from "@/lib/current-user";
import { Sidebar } from "@/components/shell/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "admin") redirect("/dashboard" as Route);

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} mode="admin" />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
