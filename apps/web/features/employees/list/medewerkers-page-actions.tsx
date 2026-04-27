"use client";

import { Download, Plus } from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useTopBarActions } from "@/features/admin-shell/context-actions/use-top-bar-actions";

export function MedewerkersPageActions() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useTopBarActions([
    {
      kind: "primary",
      label: "Nieuw",
      icon: Plus,
      shortcut: "⌘N",
      onClick: () => {
        const sp = new URLSearchParams(searchParams.toString());
        sp.set("new", "1");
        router.push(`/admin/medewerkers?${sp.toString()}` as Route);
      },
    },
    {
      kind: "secondary",
      label: "Export",
      icon: Download,
      onClick: () => toast.info("Export volgt in 1.1b"),
    },
  ]);
  return null;
}
