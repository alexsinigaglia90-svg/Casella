"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface AddressFormProps {
  type: "address";
}

interface IbanFormProps {
  type: "iban";
}

type Props = AddressFormProps | IbanFormProps;

export function ChangeRequestForm({ type }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Address fields
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [houseNumberSuffix, setHouseNumberSuffix] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  // IBAN field
  const [iban, setIban] = useState("");

  async function handleSubmit() {
    const proposedValue =
      type === "address"
        ? { street, houseNumber, houseNumberSuffix: houseNumberSuffix || undefined, postalCode, city }
        : { iban };

    setSaving(true);
    try {
      const res = await fetch("/api/profiel/change-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, proposedValue }),
      });
      if (!res.ok) {
        toast.error("Verzoek indienen mislukt");
        return;
      }
      toast.success("Wijzigingsverzoek ingediend. De admin wordt op de hoogte gesteld.");
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {type === "address" ? "Adres wijzigen" : "IBAN wijzigen"}
      </Button>
    );
  }

  return (
    <div
      className="rounded-xl border p-4 space-y-4"
      style={{ borderColor: "var(--border-subtle)", background: "var(--surface-lift)" }}
    >
      <p className="text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
        {type === "address" ? "Nieuw adres opgeven" : "Nieuw IBAN opgeven"}
      </p>

      {type === "address" ? (
        <>
          <Field label="Straat" value={street} onChange={setStreet} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Huisnummer" value={houseNumber} onChange={setHouseNumber} />
            <Field label="Toevoeging" value={houseNumberSuffix} onChange={setHouseNumberSuffix} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Postcode" value={postalCode} onChange={setPostalCode} />
            <Field label="Plaats" value={city} onChange={setCity} />
          </div>
          <p className="text-xs" style={{ color: "var(--fg-tertiary)" }}>
            PDOK-adreszoeker integratie is uitgesteld (Fase 2). Voer het adres handmatig in.
          </p>
        </>
      ) : (
        <>
          <Field label="IBAN" value={iban} onChange={setIban} />
          <p className="text-xs" style={{ color: "var(--fg-tertiary)" }}>
            Na goedkeuring wordt het IBAN in de toekomst automatisch doorgezet naar Nmbrs (Fase 2).
          </p>
        </>
      )}

      <div className="flex gap-2">
        <Button disabled={saving} onClick={handleSubmit}>
          {saving ? "Indienen…" : "Verzoek indienen"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Annuleren
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: "var(--fg-secondary)" }}>
        {label}
      </label>
      <input
        type="text"
        className="w-full rounded-md border px-3 py-2 text-sm"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--surface-base)",
          color: "var(--fg-primary)",
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
