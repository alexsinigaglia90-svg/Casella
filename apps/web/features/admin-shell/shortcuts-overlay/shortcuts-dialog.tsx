"use client";


import { SHORTCUT_SECTIONS } from "./shortcuts-data";
import { useShortcutsOverlay } from "./use-shortcuts-overlay";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ShortcutsDialog() {
  const { open, setOpen } = useShortcutsOverlay();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Sneltoetsen</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          {SHORTCUT_SECTIONS.map((section) => (
            <section key={section.title}>
              <h3
                className="mb-2 text-xs uppercase tracking-wide"
                style={{ color: "var(--fg-tertiary)" }}
              >
                {section.title}
              </h3>
              <ul className="space-y-1.5">
                {section.items.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span style={{ color: "var(--fg-secondary)" }}>{item.label}</span>
                    <span className="flex gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="rounded px-1.5 py-0.5 font-mono text-[11px]"
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
      </DialogContent>
    </Dialog>
  );
}
