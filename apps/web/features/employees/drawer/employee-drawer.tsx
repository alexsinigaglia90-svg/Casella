// apps/web/features/employees/drawer/employee-drawer.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createEmployeeSchema, type CompensationType, type AddressInput as AddressInputValue } from "@casella/types";
import { z } from "zod";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AddressInput } from "@/components/address-input/address-input";
import { toast } from "sonner";
import type { PdokAddress } from "@casella/maps";

export function EmployeeDrawer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreateMode = searchParams.get("new") === "1";
  const editId = searchParams.get("id");
  const open = isCreateMode || !!editId;

  function handleClose() {
    const params = new URLSearchParams(searchParams);
    params.delete("new");
    params.delete("id");
    router.push(`?${params.toString()}`);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="fixed right-0 top-0 h-screen w-[560px] max-w-[90vw] translate-x-0 translate-y-0 rounded-none border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
        <DialogTitle className="sr-only">
          {isCreateMode ? "Nieuwe medewerker" : "Medewerker bewerken"}
        </DialogTitle>
        {isCreateMode && <CreateForm onDone={handleClose} />}
        {editId && <p className="p-6">Edit-modus is WIP (volgt in volgende taak).</p>}
      </DialogContent>
    </Dialog>
  );
}

function toAddressInput(addr: PdokAddress | null): AddressInputValue | null {
  if (!addr) return null;
  return {
    pdokId: addr.id,
    street: addr.street,
    houseNumber: addr.houseNumber,
    houseNumberAddition: addr.houseNumberAddition,
    postalCode: addr.postalCode,
    city: addr.city,
    municipality: addr.municipality,
    province: addr.province,
    country: addr.country,
    lat: addr.lat,
    lng: addr.lng,
    rdX: addr.rdX,
    rdY: addr.rdY,
    fullDisplay: addr.fullDisplay,
  };
}

type CreateEmployeeFormValues = z.input<typeof createEmployeeSchema>;

function CreateForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [homeAddress, setHomeAddress] = useState<PdokAddress | null>(null);
  const form = useForm<CreateEmployeeFormValues>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      contractedHoursPerWeek: 40,
      defaultKmRateCents: 23,
      compensationType: "auto",
    },
  });

  async function onSubmit(values: CreateEmployeeFormValues) {
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, homeAddress: toAddressInput(homeAddress) }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      toast.success("Medewerker aangemaakt");
      router.refresh();
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Aanmaken mislukt");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col overflow-y-auto p-6">
      <header className="mb-6">
        <h2 className="font-display text-title">
          Nieuwe <em>medewerker</em>
        </h2>
      </header>

      <section className="space-y-4 border-b border-border pb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">Basis</h3>
        <Field label="E-mail (invite)" required htmlFor="emp-inviteEmail" error={form.formState.errors.inviteEmail?.message}>
          <Input id="emp-inviteEmail" {...form.register("inviteEmail")} placeholder="medewerker@ascentra.nl" />
        </Field>
        <Field label="Functietitel" htmlFor="emp-jobTitle">
          <Input id="emp-jobTitle" {...form.register("jobTitle")} placeholder="Senior Supply Chain Consultant" />
        </Field>
        <Field label="Telefoonnummer" htmlFor="emp-phone">
          <Input id="emp-phone" {...form.register("phone")} placeholder="+31 6 1234 5678" />
        </Field>
      </section>

      <section className="space-y-4 border-b border-border py-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">Dienstverband</h3>
        <Field label="Startdatum" htmlFor="emp-startDate">
          <Input
            id="emp-startDate"
            type="date"
            {...form.register("startDate", {
              setValueAs: (v) => (v === "" || v == null ? undefined : v),
            })}
          />
        </Field>
        <Field label="Contract-uren per week" htmlFor="emp-contractedHours">
          <Input
            id="emp-contractedHours"
            type="number"
            min={1}
            max={60}
            {...form.register("contractedHoursPerWeek", { valueAsNumber: true })}
          />
        </Field>
      </section>

      <section className="space-y-4 border-b border-border py-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">Vergoedingen</h3>
        <Field label="Vergoedingstype" htmlFor="emp-compensationType">
          <Select onValueChange={(v) => form.setValue("compensationType", v as CompensationType)} defaultValue="auto">
            <SelectTrigger id="emp-compensationType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="ov">Openbaar vervoer</SelectItem>
              <SelectItem value="none">Geen</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Km-tarief (in centen)" htmlFor="emp-kmRate">
          <Input id="emp-kmRate" type="number" min={0} {...form.register("defaultKmRateCents", { valueAsNumber: true })} />
        </Field>
        <Field label="Woonadres" htmlFor="emp-homeAddress">
          <div id="emp-homeAddress">
            <AddressInput value={homeAddress} onChange={setHomeAddress} />
          </div>
        </Field>
      </section>

      <section className="space-y-4 border-b border-border py-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">Noodcontact</h3>
        <Field label="Contactpersoon" htmlFor="emp-emergencyName">
          <Input id="emp-emergencyName" {...form.register("emergencyContactName")} />
        </Field>
        <Field label="Telefoon contactpersoon" htmlFor="emp-emergencyPhone">
          <Input id="emp-emergencyPhone" {...form.register("emergencyContactPhone")} />
        </Field>
      </section>

      <section className="space-y-4 py-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">Admin-notities</h3>
        <Textarea id="emp-notes" {...form.register("notes")} rows={4} placeholder="Intern, alleen zichtbaar voor admins" />
      </section>

      <div className="sticky bottom-0 mt-auto flex gap-2 border-t border-border bg-surface-base p-4">
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={form.formState.isSubmitting}
          className="flex-1"
        >
          Annuleren
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting} className="flex-1">
          {form.formState.isSubmitting ? "Bezig..." : "Aanmaken"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  children,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="flex items-center gap-1 text-xs font-medium">
        {label}
        {required && <span className="text-aurora-rose">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-aurora-rose">{error}</p>}
    </div>
  );
}
