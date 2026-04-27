import type { PdokAddress } from "@casella/maps";

export interface CreateClientFormValues {
  // Step 1 — Bedrijf
  name: string;
  kvk: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  // Step 2 — Adres
  address: PdokAddress | null;
}

export function emptyClientForm(): CreateClientFormValues {
  return {
    name: "",
    kvk: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: null,
  };
}

export const CLIENT_STEPS = [
  {
    key: "bedrijf",
    label: "Bedrijf",
    kicker: "Stap 1",
    title: "Welke klant voeg je toe?",
    sub: "Bedrijfsnaam en contactpersoon — KvK is optioneel.",
  },
  {
    key: "adres",
    label: "Adres",
    kicker: "Stap 2",
    title: "Vestigingsadres",
    sub: "Voor projecten, declaraties en routeplanning.",
  },
  {
    key: "check",
    label: "Check",
    kicker: "Stap 3",
    title: "Klaar om op te slaan",
    sub: "Controleer voor je het opslaat.",
  },
] as const;
