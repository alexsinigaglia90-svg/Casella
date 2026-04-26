import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getCurrentEmployee } from "@/lib/current-employee";

export default async function OnboardingPending() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const employee = await getCurrentEmployee();
  if (employee) redirect("/dashboard");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="font-display text-hero">
        Welkom, <em>{user.displayName.split(" ")[0]}</em>
      </h1>
      <p className="max-w-md text-fg-secondary">
        Je account is aangemeld bij Ascentra HR. Zodra je wordt geactiveerd krijg
        je een bevestiging per e-mail. Deze pagina kun je gewoon laten openstaan
        — zodra je bent gekoppeld ga je automatisch door.
      </p>
      <meta httpEquiv="refresh" content="60" />
    </main>
  );
}
