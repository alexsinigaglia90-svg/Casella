"use client";

import { Copy, Link2, Pencil, Star, StarOff, Trash } from "lucide-react";
import { toast } from "sonner";

import { useTopBarActions } from "@/features/admin-shell/context-actions/use-top-bar-actions";
import { usePinToggle } from "@/features/admin-shell/pins/use-pin-toggle";

export function EmployeeDetailActions({ employeeId }: { employeeId: string }) {
  const { isPinned, toggle } = usePinToggle("employee", employeeId);
  const pinLabel = isPinned ? "Unpin" : "Pin";
  const PinIcon = isPinned ? StarOff : Star;

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
          label: pinLabel,
          icon: PinIcon,
          onClick: () => {
            void toggle();
          },
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
            toast.info(
              "Open de drawer en gebruik 'Beëindig dienst' in de wizard.",
            ),
        },
      ],
    },
  ]);
  return null;
}
