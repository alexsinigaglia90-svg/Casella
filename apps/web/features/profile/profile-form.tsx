"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface PersonalFormProps {
  initialPhone: string | null;
  initialEmergencyContactName: string | null;
  initialEmergencyContactPhone: string | null;
}

export function PersonalForm({
  initialPhone,
  initialEmergencyContactName,
  initialEmergencyContactPhone,
}: PersonalFormProps) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [emergencyContactName, setEmergencyContactName] = useState(
    initialEmergencyContactName ?? "",
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    initialEmergencyContactPhone ?? "",
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profiel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, emergencyContactName, emergencyContactPhone }),
      });
      if (!res.ok) {
        toast.error("Opslaan mislukt");
        return;
      }
      toast.success("Gegevens opgeslagen");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Telefoonnummer" value={phone} onChange={setPhone} type="tel" />
      <Field
        label="Noodcontact naam"
        value={emergencyContactName}
        onChange={setEmergencyContactName}
      />
      <Field
        label="Noodcontact telefoon"
        value={emergencyContactPhone}
        onChange={setEmergencyContactPhone}
        type="tel"
      />
      <Button disabled={saving} onClick={handleSave}>
        {saving ? "Opslaan…" : "Opslaan"}
      </Button>
    </div>
  );
}

interface PreferencesFormProps {
  initialTheme: "light" | "dark" | "system";
  initialLanguage: "nl" | "en";
  initialBio: string | null;
  initialAvatarStoragePath: string | null;
}

export function PreferencesForm({
  initialTheme,
  initialLanguage,
  initialBio,
  initialAvatarStoragePath,
}: PreferencesFormProps) {
  const router = useRouter();
  const [themePreference, setThemePreference] = useState<"light" | "dark" | "system">(
    initialTheme,
  );
  const [languagePreference, setLanguagePreference] = useState<"nl" | "en">(initialLanguage);
  const [bio, setBio] = useState(initialBio ?? "");
  const [avatarStoragePath, setAvatarStoragePath] = useState(initialAvatarStoragePath ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profiel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themePreference, languagePreference, bio, avatarStoragePath }),
      });
      if (!res.ok) {
        toast.error("Opslaan mislukt");
        return;
      }
      toast.success("Voorkeuren opgeslagen");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--fg-secondary)" }}>
          Thema
        </label>
        <select
          className="rounded-md border px-3 py-2 text-sm w-full"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--surface-lift)",
            color: "var(--fg-primary)",
          }}
          value={themePreference}
          onChange={(e) => setThemePreference(e.target.value as "light" | "dark" | "system")}
        >
          <option value="system">Systeem</option>
          <option value="light">Licht</option>
          <option value="dark">Donker</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--fg-secondary)" }}>
          Taal
        </label>
        <select
          className="rounded-md border px-3 py-2 text-sm w-full"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--surface-lift)",
            color: "var(--fg-primary)",
          }}
          value={languagePreference}
          onChange={(e) => setLanguagePreference(e.target.value as "nl" | "en")}
        >
          <option value="nl">Nederlands</option>
          <option value="en">English</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--fg-secondary)" }}>
          Bio (max 500 tekens)
        </label>
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--surface-lift)",
            color: "var(--fg-primary)",
          }}
          rows={3}
          maxLength={500}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <p className="mt-1 text-xs" style={{ color: "var(--fg-tertiary)" }}>
          {bio.length}/500
        </p>
      </div>

      <Field
        label="Avatar pad (storage stub)"
        value={avatarStoragePath}
        onChange={setAvatarStoragePath}
        hint="Volledig storage-pad. Avatar-upload via Supabase Storage volgt in Fase 2."
      />

      <Button disabled={saving} onClick={handleSave}>
        {saving ? "Opslaan…" : "Opslaan"}
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: "var(--fg-secondary)" }}>
        {label}
      </label>
      <input
        type={type}
        className="w-full rounded-md border px-3 py-2 text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-lift)",
          color: "var(--fg-primary)",
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && (
        <p className="mt-1 text-xs" style={{ color: "var(--fg-tertiary)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}
