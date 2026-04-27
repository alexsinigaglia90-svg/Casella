"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Purpose = "mortgage" | "rent" | "other";

export function StatementForm() {
  const router = useRouter();
  const [purpose, setPurpose] = useState<Purpose>("mortgage");
  const [submitting, setSubmitting] = useState(false);

  const [nhgIndicator, setNhgIndicator] = useState(false);
  const [lenderName, setLenderName] = useState("");
  const [loanAmountEur, setLoanAmountEur] = useState("");

  const [landlordName, setLandlordName] = useState("");
  const [landlordAddress, setLandlordAddress] = useState("");
  const [monthlyRentEur, setMonthlyRentEur] = useState("");

  const [purposeOtherReason, setPurposeOtherReason] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { purpose };
      if (purpose === "mortgage") {
        body.nhgIndicator = nhgIndicator;
        if (lenderName) body.lenderName = lenderName;
        if (loanAmountEur)
          body.loanAmountIndicativeCents = Math.round(parseFloat(loanAmountEur) * 100);
      } else if (purpose === "rent") {
        if (landlordName) body.landlordName = landlordName;
        if (landlordAddress) body.landlordAddress = landlordAddress;
        if (monthlyRentEur)
          body.monthlyRentCents = Math.round(parseFloat(monthlyRentEur) * 100);
      } else if (purpose === "other") {
        if (purposeOtherReason) body.purposeOtherReason = purposeOtherReason;
      }
      const res = await fetch("/api/werkgeversverklaring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { message?: string };
        toast.error(json.message ?? "Aanmaken mislukt");
        return;
      }
      toast.success("Werkgeversverklaring is gegenereerd");
      router.refresh();
      // Reset form fields
      setLenderName("");
      setLoanAmountEur("");
      setLandlordName("");
      setLandlordAddress("");
      setMonthlyRentEur("");
      setPurposeOtherReason("");
      setNhgIndicator(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border p-6 glass-card"
      style={{
        borderColor: "var(--border-subtle)",
        backgroundColor: "var(--surface-card)",
      }}
    >
      <div>
        <p
          className="mb-2 text-sm font-medium"
          style={{ color: "var(--fg-primary)" }}
        >
          Doel
        </p>
        <div className="flex gap-4">
          <PurposeRadio
            label="Hypotheek"
            value="mortgage"
            current={purpose}
            onChange={setPurpose}
          />
          <PurposeRadio
            label="Huur"
            value="rent"
            current={purpose}
            onChange={setPurpose}
          />
          <PurposeRadio
            label="Anders"
            value="other"
            current={purpose}
            onChange={setPurpose}
          />
        </div>
      </div>

      {purpose === "mortgage" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="nhg"
              checked={nhgIndicator}
              onChange={(e) => setNhgIndicator(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="nhg" className="text-sm" style={{ color: "var(--fg-primary)" }}>
              NHG-indicatie
            </label>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
              Geldverstrekker
            </label>
            <Input
              value={lenderName}
              onChange={(e) => setLenderName(e.target.value)}
              placeholder="bijv. ABN AMRO"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
              Indicatief leenbedrag (€)
            </label>
            <Input
              type="number"
              step="0.01"
              value={loanAmountEur}
              onChange={(e) => setLoanAmountEur(e.target.value)}
              placeholder="350000"
            />
          </div>
        </div>
      )}

      {purpose === "rent" && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
              Verhuurder
            </label>
            <Input
              value={landlordName}
              onChange={(e) => setLandlordName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
              Adres verhuurder
            </label>
            <Textarea
              value={landlordAddress}
              onChange={(e) => setLandlordAddress(e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
              Maandhuur (€)
            </label>
            <Input
              type="number"
              step="0.01"
              value={monthlyRentEur}
              onChange={(e) => setMonthlyRentEur(e.target.value)}
            />
          </div>
        </div>
      )}

      {purpose === "other" && (
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: "var(--fg-primary)" }}>
            Doel (toelichting)
          </label>
          <Textarea
            value={purposeOtherReason}
            onChange={(e) => setPurposeOtherReason(e.target.value)}
            rows={3}
            placeholder="Korte toelichting op het doel"
          />
        </div>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Genereren…" : "Werkgeversverklaring aanvragen"}
      </Button>
    </form>
  );
}

function PurposeRadio({
  label,
  value,
  current,
  onChange,
}: {
  label: string;
  value: "mortgage" | "rent" | "other";
  current: string;
  onChange: (v: "mortgage" | "rent" | "other") => void;
}) {
  const checked = current === value;
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--fg-primary)" }}>
      <input
        type="radio"
        name="purpose"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}
