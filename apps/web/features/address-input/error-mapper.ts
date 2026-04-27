import type { ApiError } from "@casella/types";

const ADDRESS_ERROR_COPY: Record<string, string> = {
  pdok_unavailable: "Adresservice tijdelijk onbereikbaar — probeer over een minuut opnieuw",
  pdok_timeout: "Adresservice reageert niet, probeer opnieuw",
  pdok_not_found: "Geen adres gevonden",
  pdok_invalid_query: "Zoekopdracht is niet geldig",
  not_found: "Geen adres gevonden voor dit ID",
  internal_error: "Er ging iets mis aan onze kant",
};

export function mapAddressError(err: ApiError): string {
  return ADDRESS_ERROR_COPY[err.error] ?? err.message;
}
