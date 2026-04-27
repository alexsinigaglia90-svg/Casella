"use client";

import { Copy, Link2, Pencil, Star, Trash } from "lucide-react";
import { toast } from "sonner";

import { useTopBarActions } from "@/features/admin-shell/context-actions/use-top-bar-actions";

export function EmployeeDetailActions() {
  useTopBarActions([
    {
      kind: "primary",
      label: "Bewerken",
      icon: Pencil,
      onClick: () => {
        // No-op: edit-drawer / fallback page is already showing the wizard.
      },
    },
    {
      kind: "kebab",
      items: [
        {
          label: "Dupliceer",
          icon: Copy,
          onClick: () => toast.info("Dupliceren komt later"),
        },
        {
          label: "Pin / Unpin",
          icon: Star,
          onClick: () => toast.info("Pinnen komt in C-14"),
        },
        {
          label: "Kopieer link",
          icon: Link2,
          onClick: () => {
            void navigator.clipboard.writeText(window.location.href);
            toast.success("Link gekopieerd");
          },
        },
        {
          label: "Beëindig",
          icon: Trash,
          destructive: true,
          onClick: () =>
            toast.info("Open de drawer en gebruik 'Beëindig dienst' in de wizard."),
        },
      ],
    },
  ]);
  return null;
}
