import type { PdokAddress } from "@casella/maps";
import type {
  AddressInput,
  ClientWithAddress,
  UpdateClientInput,
} from "@casella/types";

import type { CreateClientFormValues } from "../types";

export function addressInputToPdokAddress(addr: AddressInput): PdokAddress {
  return {
    id: addr.pdokId,
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

export function pdokAddressToAddressInput(
  addr: PdokAddress | null,
): AddressInput | null {
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

/**
 * Seed a CreateClientFormValues from a fetched ClientWithAddress.
 * Used by the wizard in edit-mode as the initial form state.
 */
export function clientToForm(c: ClientWithAddress): CreateClientFormValues {
  return {
    name: c.name,
    kvk: c.kvk ?? "",
    contactName: c.contactName ?? "",
    contactEmail: c.contactEmail ?? "",
    contactPhone: c.contactPhone ?? "",
    address: addressInputToPdokAddress(c.address),
  };
}

/**
 * Compute a sparse PATCH payload by deep-comparing initial vs. current form
 * values. Returns Omit<UpdateClientInput, "id"> — the route handler injects
 * the id from the URL.
 */
export function diffClientForm(
  initial: CreateClientFormValues,
  current: CreateClientFormValues,
): Omit<Partial<UpdateClientInput>, "id"> {
  const dirty: Omit<Partial<UpdateClientInput>, "id"> = {};

  if (initial.name !== current.name) dirty.name = current.name;
  if (initial.kvk !== current.kvk) dirty.kvk = current.kvk || null;
  if (initial.contactName !== current.contactName) {
    dirty.contactName = current.contactName || null;
  }
  if (initial.contactEmail !== current.contactEmail) {
    dirty.contactEmail = current.contactEmail || null;
  }
  if (initial.contactPhone !== current.contactPhone) {
    dirty.contactPhone = current.contactPhone || null;
  }
  if (JSON.stringify(initial.address) !== JSON.stringify(current.address)) {
    const next = pdokAddressToAddressInput(current.address);
    if (next) dirty.address = next;
  }

  return dirty;
}
