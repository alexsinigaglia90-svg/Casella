"use client";

import { Download, Plus } from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

import { useTopBarActions } from "@/features/admin-shell/context-actions/use-top-bar-actions";
import { useQuickCreate } from "@/features/admin-shell/quick-create/use-quick-create";

export function KlantenPageActions() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onCreate = useCallback(() => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("new", "1");
    router.push(`/admin/klanten?${sp.toString()}` as Route);
  }, [router, searchParams]);

  useTopBarActions([
    {
      kind: "primary",
      label: "Nieuw",
      icon: Plus,
      shortcut: "⌘N",
      trackingKey: "clickedNewClientButton",
      onClick: onCreate,
    },
    {
      kind: "secondary",
      label: "Export",
      icon: Download,
      onClick: () => toast.info("Export volgt later"),
    },
  ]);

  useQuickCreate(onCreate, "Nieuwe klant");

  return null;
}
