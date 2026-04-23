import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Route } from "next";

// `/dashboard` does not exist yet (Task 15 adds it). Cast via Route<string> so
// Next.js `typedRoutes` doesn't reject the unknown route at build time.
const DASHBOARD_ROUTE = "/dashboard" as Route;

export default async function HomePage() {
  const session = await auth();
  if (session) redirect(DASHBOARD_ROUTE);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold">Casella</h1>
      <p className="text-muted-foreground">Medewerkerportaal Ascentra</p>
      <form
        action={async () => {
          "use server";
          await signIn("microsoft-entra-id", { redirectTo: DASHBOARD_ROUTE });
        }}
      >
        <Button type="submit">Log in met Microsoft</Button>
      </form>
    </main>
  );
}
