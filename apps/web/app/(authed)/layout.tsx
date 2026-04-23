import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { Sidebar } from "@/components/shell/sidebar";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} mode="employee" />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
