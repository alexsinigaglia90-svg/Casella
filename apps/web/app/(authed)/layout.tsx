import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { NavEmployee } from "@/components/nav-employee";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <div className="flex min-h-screen">
      <NavEmployee user={user} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
