import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold">Casella</h1>
      <p className="text-muted-foreground">Medewerkerportaal Ascentra</p>
      <Button>Log in met Microsoft</Button>
    </main>
  );
}
