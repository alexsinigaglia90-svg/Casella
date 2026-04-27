import type { PdokAddress } from "@casella/maps";
import type {
  AddressInput,
  EmployeeWithAddress,
  UpdateEmployeeInput,
} from "@casella/types";

import type { CreateEmployeeFormValues } from "../types";

/**
 * Convert a stored AddressInput (DB shape) to the PdokAddress shape the form
 * uses internally — mirrors the inverse of `toAddressInput` in the wizard.
 */
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

export function pdokAddressToAddressInput(addr: PdokAddress | null): AddressInput | null {
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
 * Seed a CreateEmployeeFormValues from a fetched EmployeeWithAddress.
 * Used by the wizard in edit-mode as the initial form state.
 */
export function employeeToForm(emp: EmployeeWithAddress): CreateEmployeeFormValues {
  return {
    firstName: emp.firstName ?? "",
    lastName: emp.lastName ?? "",
    inviteEmail: emp.inviteEmail ?? "",
    phone: emp.phone ?? "",
    jobTitle: emp.jobTitle ?? "",
    startDate: emp.startDate ?? "",
    contractedHours: emp.contractedHoursPerWeek,
    compensationType: emp.compensationType,
    kmRateCents: emp.defaultKmRateCents,
    address: emp.address ? addressInputToPdokAddress(emp.address) : null,
    emergencyName: emp.emergencyContactName ?? "",
    emergencyPhone: emp.emergencyContactPhone ?? "",
    notes: emp.notes ?? "",
  };
}

/**
 * Compute a sparse PATCH payload by deep-comparing initial vs. current form
 * values. Field-name remapping (form → schema) happens here so the caller can
 * just `JSON.stringify(diffForm(...))` and POST it.
 *
 * Returns an Omit<UpdateEmployeeInput, "id"> — the route handler injects the
 * id from the URL, so we never need to send it in the body.
 */
export function diffForm(
  initial: CreateEmployeeFormValues,
  current: CreateEmployeeFormValues,
): Omit<Partial<UpdateEmployeeInput>, "id"> {
  const dirty: Omit<Partial<UpdateEmployeeInput>, "id"> = {};

  if (initial.firstName !== current.firstName) dirty.firstName = current.firstName;
  if (initial.lastName !== current.lastName) dirty.lastName = current.lastName;
  if (initial.inviteEmail !== current.inviteEmail) dirty.inviteEmail = current.inviteEmail;
  if (initial.phone !== current.phone) dirty.phone = current.phone;
  if (initial.jobTitle !== current.jobTitle) dirty.jobTitle = current.jobTitle;
  if (initial.startDate !== current.startDate) dirty.startDate = current.startDate || null;
  if (initial.contractedHours !== current.contractedHours) {
    dirty.contractedHoursPerWeek = current.contractedHours;
  }
  if (initial.compensationType !== current.compensationType) {
    dirty.compensationType = current.compensationType;
  }
  if (initial.kmRateCents !== current.kmRateCents) {
    dirty.defaultKmRateCents = current.kmRateCents;
  }
  if (JSON.stringify(initial.address) !== JSON.stringify(current.address)) {
    dirty.homeAddress = pdokAddressToAddressInput(current.address);
  }
  if (initial.emergencyName !== current.emergencyName) {
    dirty.emergencyContactName = current.emergencyName;
  }
  if (initial.emergencyPhone !== current.emergencyPhone) {
    dirty.emergencyContactPhone = current.emergencyPhone;
  }
  if (initial.notes !== current.notes) dirty.notes = current.notes;

  return dirty;
}
