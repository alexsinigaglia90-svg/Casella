"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { useTopBarActions } from "@/features/admin-shell/context-actions/use-top-bar-actions";

export function UrenPageActions() {
  const router = useRouter();

  const onRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useTopBarActions([
    {
      kind: "secondary",
      label: "Vernieuwen",
      icon: RefreshCw,
      onClick: onRefresh,
    },
  ]);

  return null;
}
