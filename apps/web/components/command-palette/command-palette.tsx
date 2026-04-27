"use client";

import { Command } from "cmdk";
import { Users, Briefcase, Folders, UserCheck, Plus, Settings, Keyboard, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { usePalette } from "@/features/admin-shell/command-palette/palette-context";
import { useShortcutsOverlay } from "@/features/admin-shell/shortcuts-overlay/use-shortcuts-overlay";

export function CommandPalette() {
  const { open, setOpen } = usePalette();
  const { setOpen: setShortcutsOpen } = useShortcutsOverlay();
  const router = useRouter();

  function runCommand(cb: () => void) {
    setOpen(false);
    cb();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 gap-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command className="rounded-xl bg-surface-base">
          <Command.Input
            placeholder="Zoek naar een pagina, actie of entity..."
            className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-fg-tertiary"
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="p-4 text-center text-sm text-fg-tertiary">
              Geen resultaten
            </Command.Empty>

            <Command.Group heading="Navigatie">
              <CmdItem icon={Users} onSelect={() => runCommand(() => router.push("/admin/medewerkers" as Route))}>
                Medewerkers
              </CmdItem>
              <CmdItem icon={Briefcase} onSelect={() => runCommand(() => router.push("/admin/klanten" as Route))}>
                Klanten
              </CmdItem>
              <CmdItem icon={Folders} onSelect={() => runCommand(() => router.push("/admin/projecten" as Route))}>
                Projecten
              </CmdItem>
              <CmdItem icon={UserCheck} onSelect={() => runCommand(() => router.push("/admin/toewijzingen" as Route))}>
                Toewijzingen
              </CmdItem>
            </Command.Group>

            <Command.Group heading="Acties">
              <CmdItem icon={Plus} onSelect={() => runCommand(() => router.push("/admin/medewerkers?new=1" as Route))}>
                Nieuwe medewerker
              </CmdItem>
              <CmdItem icon={Plus} onSelect={() => runCommand(() => router.push("/admin/klanten?new=1" as Route))}>
                Nieuwe klant
              </CmdItem>
              <CmdItem icon={Plus} onSelect={() => runCommand(() => router.push("/admin/projecten?new=1" as Route))}>
                Nieuw project
              </CmdItem>
            </Command.Group>

            <Command.Group heading="Instellingen">
              <CmdItem icon={Settings} onSelect={() => runCommand(() => router.push("/admin/settings" as Route))}>
                Instellingen
              </CmdItem>
            </Command.Group>

            <Command.Group heading="Hulp">
              <CmdItem
                icon={Keyboard}
                onSelect={() => runCommand(() => setShortcutsOpen(true))}
              >
                Toon sneltoetsen
              </CmdItem>
              <CmdItem
                icon={LogOut}
                onSelect={() => runCommand(() => signOut({ callbackUrl: "/" }))}
              >
                Afmelden
              </CmdItem>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CmdItem({ icon: Icon, onSelect, children }: { icon: LucideIcon; onSelect: () => void; children: React.ReactNode }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm aria-selected:bg-surface-deep"
    >
      <Icon className="h-4 w-4 text-fg-tertiary" aria-hidden />
      {children}
    </Command.Item>
  );
}
