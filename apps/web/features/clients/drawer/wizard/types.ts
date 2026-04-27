import type { PdokAddress } from "@casella/maps";

export interface CreateClientFormValues {
  // Step 1 — Bedrijf
  name: string;
  kvk: string;
  // Step 2 — Contact
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  // Step 3 — Adres
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
    title: "Bedrijfsgegevens",
    sub: "Bedrijfsnaam en KvK-nummer — wij zoeken de rest op.",
  },
  {
    key: "contact",
    label: "Contact",
    kicker: "Stap 2",
    title: "Contactpersoon",
    sub: "Wie is het aanspreekpunt bij deze klant?",
  },
  {
    key: "adres",
    label: "Adres",
    kicker: "Stap 3",
    title: "Vestigingsadres",
    sub: "Voor projecten, declaraties en routeplanning.",
  },
  {
    key: "check",
    label: "Check",
    kicker: "Stap 4",
    title: "Klaar om op te slaan",
    sub: "Controleer voor je het opslaat.",
  },
] as const;
