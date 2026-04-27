"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { TIPS } from "./tips";
import {
  dismissTip,
  getActionCount,
  isOptedOut,
  isTipDismissed,
  trackAction,
} from "./tracker";

export function useCoachingTipsScanner(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Increment "opens" counter per session-mount (used by shortcuts-overlay tip)
    trackAction("opens");

    if (isOptedOut()) return;

    for (const tip of TIPS) {
      if (isTipDismissed(tip.id)) continue;
      const count = getActionCount(tip.trigger.actionKey);
      const without = tip.trigger.withoutActionKey
        ? getActionCount(tip.trigger.withoutActionKey)
        : 0;
      if (count >= tip.trigger.threshold && without === 0) {
        toast(tip.copy, {
          duration: 8_000,
          action: {
            label: "Begrepen",
            onClick: () => dismissTip(tip.id),
          },
          onDismiss: () => dismissTip(tip.id),
        });
        // Show only one tip per scan
        break;
      }
    }
  }, []);
}
