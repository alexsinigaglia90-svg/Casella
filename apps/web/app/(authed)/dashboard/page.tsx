import { getCurrentUser } from "@/lib/current-user";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p>Welkom, {user.displayName}</p>
      <p className="text-muted-foreground">Rol: {user.role}</p>
    </div>
  );
}
