import type { AuditEvent } from "@casella/db";
import { Bell, Mail, Pause, RotateCcw, Star, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CopyEntry {
  icon: LucideIcon;
  copy: (e: AuditEvent) => string;
}

const FALLBACK: CopyEntry = {
  icon: Bell,
  copy: (e) => {
    const target = e.resourceName ?? e.resourceType;
    return `${target} · ${e.action}`;
  },
};

export const EVENT_COPY: Record<string, CopyEntry> = {
  "employees.create": {
    icon: UserPlus,
    copy: (e) => `${e.resourceName ?? "Medewerker"} · aangemaakt`,
  },
  "employees.update": {
    icon: Bell,
    copy: (e) => `${e.resourceName ?? "Medewerker"} · bijgewerkt`,
  },
  "employees.terminate.initiate": {
    icon: Pause,
    copy: (e) =>
      `${e.resourceName ?? "Medewerker"} · beëindiging ingepland`,
  },
  "employees.terminate.cancel_pending": {
    icon: RotateCcw,
    copy: (e) =>
      `${e.resourceName ?? "Medewerker"} · beëindiging geannuleerd`,
  },
  "employees.terminate.executed": {
    icon: Pause,
    copy: (e) => `${e.resourceName ?? "Medewerker"} · beëindigd`,
  },
  "employees.welcome_email_sent": {
    icon: Mail,
    copy: (e) =>
      `${e.resourceName ?? "Medewerker"} · welkomstmail verstuurd`,
  },
  "pin.create": {
    icon: Star,
    copy: (e) => `${e.resourceName ?? e.resourceType} · gepind`,
  },
  "pin.delete": {
    icon: Star,
    copy: (e) => `${e.resourceName ?? e.resourceType} · niet meer gepind`,
  },
};

export function getEventCopy(action: string): CopyEntry {
  return EVENT_COPY[action] ?? FALLBACK;
}

export type { AuditEvent };
