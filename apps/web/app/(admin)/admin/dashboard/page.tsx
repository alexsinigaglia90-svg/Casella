import { getCurrentUser } from "@/lib/current-user";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p>Ingelogd als {user.displayName} (admin)</p>
    </div>
  );
}
