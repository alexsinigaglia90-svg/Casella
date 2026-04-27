"use client";

import { Command } from "cmdk";
import { Users, Briefcase, Folders, UserCheck, Plus, Settings, Keyboard, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEmployeeListCache } from "@/features/admin-shell/breadcrumb-switcher/employee-list-cache-context";
import { usePalette } from "@/features/admin-shell/command-palette/palette-context";
import { ScopeChip } from "@/features/admin-shell/palette-scopes/scope-chip";
import { useCommandScope } from "@/features/admin-shell/palette-scopes/use-command-scope";
import type { CommandScope } from "@/features/admin-shell/palette-scopes/use-command-scope";
import { SHORTCUT_SECTIONS } from "@/features/admin-shell/shortcuts-overlay/shortcuts-data";
import { useShortcutsOverlay } from "@/features/admin-shell/shortcuts-overlay/use-shortcuts-overlay";

type RunCommand = (cb: () => void) => void;

interface CommandsScopeProps {
  runCommand: RunCommand;
  setShortcutsOpen: (v: boolean) => void;
}

export function CommandPalette() {
  const { open, setOpen } = usePalette();
  const { setOpen: setShortcutsOpen } = useShortcutsOverlay();
  const { scope, query, setQuery, onKeyDown, reset } = useCommandScope();

  function runCommand(cb: () => void) {
    setOpen(false);
    reset();
    cb();
  }

  function close() {
    setOpen(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
        else setOpen(true);
      }}
    >
      <DialogContent className="max-w-xl gap-0 p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command className="rounded-xl bg-surface-base" shouldFilter={scope !== "help"}>
          <div
            className="flex items-center gap-2 border-b px-3"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            {scope && <ScopeChip scope={scope} />}
            <Command.Input
              value={query}
              onValueChange={setQuery}
              onKeyDown={onKeyDown}
              placeholder={placeholderForScope(scope)}
              className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-fg-tertiary"
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty
              className="p-4 text-center text-sm"
              style={{ color: "var(--fg-tertiary)" }}
            >
              Geen resultaten
            </Command.Empty>
            {scope === null && (
              <MixedScopeContent runCommand={runCommand} setShortcutsOpen={setShortcutsOpen} />
            )}
            {scope === "commands" && (
              <CommandsScopeContent runCommand={runCommand} setShortcutsOpen={setShortcutsOpen} />
            )}
            {scope === "employees" && <EmployeesScopeContent runCommand={runCommand} />}
            {scope === "projects" && <ProjectsScopeContent />}
            {scope === "help" && <HelpScopeContent />}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function placeholderForScope(s: CommandScope): string {
  switch (s) {
    case "commands":
      return "Welke actie?";
    case "employees":
      return "Naam van medewerker...";
    case "projects":
      return "Project (komt in 1.1c)";
    case "help":
      return "Zoek sneltoets...";
    default:
      return "Zoek of voer uit...";
  }
}

function MixedScopeContent({ runCommand, setShortcutsOpen }: CommandsScopeProps) {
  return <ActionGroups runCommand={runCommand} setShortcutsOpen={setShortcutsOpen} />;
}

function CommandsScopeContent({ runCommand, setShortcutsOpen }: CommandsScopeProps) {
  return <ActionGroups runCommand={runCommand} setShortcutsOpen={setShortcutsOpen} />;
}

function ActionGroups({ runCommand, setShortcutsOpen }: CommandsScopeProps) {
  const router = useRouter();
  return (
    <>
      <Command.Group heading="Navigatie">
        <CmdItem
          icon={Users}
          onSelect={() => runCommand(() => router.push("/admin/medewerkers" as Route))}
        >
          Medewerkers
        </CmdItem>
        <CmdItem
          icon={Briefcase}
          onSelect={() => runCommand(() => router.push("/admin/klanten" as Route))}
        >
          Klanten
        </CmdItem>
        <CmdItem
          icon={Folders}
          onSelect={() => runCommand(() => router.push("/admin/projecten" as Route))}
        >
          Projecten
        </CmdItem>
        <CmdItem
          icon={UserCheck}
          onSelect={() => runCommand(() => router.push("/admin/toewijzingen" as Route))}
        >
          Toewijzingen
        </CmdItem>
      </Command.Group>

      <Command.Group heading="Acties">
        <CmdItem
          icon={Plus}
          onSelect={() => runCommand(() => router.push("/admin/medewerkers?new=1" as Route))}
        >
          Nieuwe medewerker
        </CmdItem>
        <CmdItem
          icon={Plus}
          onSelect={() => runCommand(() => router.push("/admin/klanten?new=1" as Route))}
        >
          Nieuwe klant
        </CmdItem>
        <CmdItem
          icon={Plus}
          onSelect={() => runCommand(() => router.push("/admin/projecten?new=1" as Route))}
        >
          Nieuw project
        </CmdItem>
      </Command.Group>

      <Command.Group heading="Instellingen">
        <CmdItem
          icon={Settings}
          onSelect={() => runCommand(() => router.push("/admin/settings" as Route))}
        >
          Instellingen
        </CmdItem>
      </Command.Group>

      <Command.Group heading="Hulp">
        <CmdItem icon={Keyboard} onSelect={() => runCommand(() => setShortcutsOpen(true))}>
          Toon sneltoetsen
        </CmdItem>
        <CmdItem icon={LogOut} onSelect={() => runCommand(() => signOut({ callbackUrl: "/" }))}>
          Afmelden
        </CmdItem>
      </Command.Group>
    </>
  );
}

function EmployeesScopeContent({ runCommand }: { runCommand: RunCommand }) {
  const router = useRouter();
  const { employees } = useEmployeeListCache();
  if (employees.length === 0) {
    return (
      <Command.Empty
        className="p-4 text-center text-sm"
        style={{ color: "var(--fg-tertiary)" }}
      >
        Open eerst /admin/medewerkers — dan zijn ze hier zoekbaar.
      </Command.Empty>
    );
  }
  return (
    <Command.Group heading="Medewerkers">
      {employees.map((e) => (
        <CmdItem
          key={e.id}
          icon={Users}
          onSelect={() =>
            runCommand(() => router.push(`/admin/medewerkers/${e.id}` as Route))
          }
        >
          {e.displayName}
          {e.jobTitle && (
            <span className="ml-auto text-xs" style={{ color: "var(--fg-tertiary)" }}>
              {e.jobTitle}
            </span>
          )}
        </CmdItem>
      ))}
    </Command.Group>
  );
}

function ProjectsScopeContent() {
  return (
    <div className="p-4 text-center text-sm" style={{ color: "var(--fg-tertiary)" }}>
      Projecten komen in Plan 1.1c.
    </div>
  );
}

function HelpScopeContent() {
  return (
    <div className="space-y-4 p-3">
      {SHORTCUT_SECTIONS.map((section) => (
        <section key={section.title}>
          <h3
            className="mb-1.5 text-xs uppercase tracking-wide"
            style={{ color: "var(--fg-tertiary)" }}
          >
            {section.title}
          </h3>
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.label} className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--fg-secondary)" }}>{item.label}</span>
                <span className="flex gap-1">
                  {item.keys.map((k) => (
                    <kbd
                      key={k}
                      className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                      style={{
                        background: "var(--surface-deep)",
                        color: "var(--fg-tertiary)",
                      }}
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function CmdItem({
  icon: Icon,
  onSelect,
  children,
}: {
  icon: LucideIcon;
  onSelect: () => void;
  children: React.ReactNode;
}) {
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
