"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EMPLOYEE_NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { DEFAULT_EMAIL_PREFS } from "@/lib/notifications/preferences";

const TYPE_LABELS: Record<string, string> = {
  "leave.approved": "Verlof goedgekeurd",
  "leave.rejected": "Verlof afgewezen",
  "expense.approved": "Declaratie goedgekeurd",
  "expense.rejected": "Declaratie afgewezen",
  "hours.rejected": "Uren afgewezen",
  "hours.approved": "Uren goedgekeurd",
  "statement.ready": "Werkgeversverklaring klaar",
  "payslip.available": "Loonstrook beschikbaar",
  "contract.uploaded": "Contract geüpload",
  "bonus.paid": "Bonus uitbetaald",
  "address.change.approved": "Adreswijziging goedgekeurd",
  "iban.change.approved": "IBAN-wijziging goedgekeurd",
  "vacation.balance.low": "Vakantiesaldo laag",
  "hours.missing.reminder": "Uren-herinnering",
  "vacation.unused.year-end": "Ongebruikt verlof (jaarafsluiting)",
  "broadcast.general": "Algemeen bericht",
};

interface Props {
  initialPrefs: Record<string, boolean>;
}

export function EmailPreferences({ initialPrefs }: Props) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const merged: Record<string, boolean> = { ...DEFAULT_EMAIL_PREFS };
    for (const [k, v] of Object.entries(initialPrefs)) {
      merged[k] = v;
    }
    return merged;
  });
  const [saving, setSaving] = useState(false);

  function toggle(type: string) {
    setPrefs((prev) => ({ ...prev, [type]: !prev[type] }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profiel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotificationPreferences: prefs }),
      });
      if (!res.ok) {
        toast.error("Opslaan mislukt");
        return;
      }
      toast.success("E-mailvoorkeuren opgeslagen");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {EMPLOYEE_NOTIFICATION_TYPES.map((type) => {
          const enabled = prefs[type] !== false;
          return (
            <li key={type} className="flex items-center justify-between gap-4">
              <span className="text-sm" style={{ color: "var(--fg-primary)" }}>
                {TYPE_LABELS[type] ?? type}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => toggle(type)}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"
                style={{
                  background: enabled ? "var(--aurora-violet)" : "var(--border-subtle)",
                }}
              >
                <span
                  className="pointer-events-none inline-block h-4 w-4 transform rounded-full shadow transition-transform"
                  style={{
                    background: "var(--surface-base)",
                    transform: enabled ? "translateX(16px)" : "translateX(0)",
                  }}
                />
              </button>
            </li>
          );
        })}
      </ul>

      <Button disabled={saving} onClick={handleSave}>
        {saving ? "Opslaan…" : "Opslaan"}
      </Button>
    </div>
  );
}
