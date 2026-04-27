"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Employee {
  id: string;
  name: string;
}

interface Props {
  employees: Employee[];
}

export function BroadcastForm({ employees }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [everyone, setEveryone] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleEmployee(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSubmit() {
    if (!message.trim()) {
      toast.error("Voer een bericht in");
      return;
    }
    if (!everyone && selectedIds.length === 0) {
      toast.error("Selecteer minimaal één medewerker");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          targetEmployeeIds: everyone ? null : selectedIds,
        }),
      });
      if (!res.ok) {
        toast.error("Verzenden mislukt");
        return;
      }
      const data = (await res.json()) as { sent: number };
      toast.success(`Bericht verstuurd naar ${data.sent} medewerker${data.sent === 1 ? "" : "s"}`);
      setMessage("");
      setEveryone(true);
      setSelectedIds([]);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="rounded-xl border p-6 space-y-4"
      style={{ background: "var(--surface-base)", borderColor: "var(--border-subtle)" }}
    >
      <h2 className="text-base font-semibold" style={{ color: "var(--fg-primary)" }}>
        Nieuw bericht
      </h2>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: "var(--fg-secondary)" }}>
          Bericht
        </label>
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--surface-lift)",
            color: "var(--fg-primary)",
          }}
          rows={4}
          maxLength={2000}
          value={message}
          placeholder="Typ hier je bericht voor de medewerkers…"
          onChange={(e) => setMessage(e.target.value)}
        />
        <p className="mt-1 text-xs" style={{ color: "var(--fg-tertiary)" }}>
          {message.length}/2000
        </p>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={everyone}
            onChange={(e) => setEveryone(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm" style={{ color: "var(--fg-primary)" }}>
            Iedereen (alle actieve medewerkers)
          </span>
        </label>
      </div>

      {!everyone && (
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: "var(--fg-secondary)" }}>
            Selecteer medewerkers
          </p>
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {employees.map((emp) => (
              <li key={emp.id}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(emp.id)}
                    onChange={() => toggleEmployee(emp.id)}
                    className="rounded"
                  />
                  <span className="text-sm" style={{ color: "var(--fg-primary)" }}>
                    {emp.name}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button disabled={saving || !message.trim()} onClick={handleSubmit}>
        {saving ? "Verzenden…" : "Verstuur bericht"}
      </Button>
    </div>
  );
}
