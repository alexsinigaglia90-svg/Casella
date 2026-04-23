import { z } from "zod";

export const pdokSuggestionSchema = z.object({
  id: z.string(),
  weergavenaam: z.string(),
  type: z.string(),
  score: z.number(),
});
export type PdokSuggestion = z.infer<typeof pdokSuggestionSchema>;

export const pdokAddressSchema = z.object({
  id: z.string(),
  street: z.string(),
  houseNumber: z.string(),
  houseNumberAddition: z.string().nullable(),
  postalCode: z.string(),
  city: z.string(),
  municipality: z.string().nullable(),
  province: z.string().nullable(),
  country: z.literal("NL"),
  lat: z.number(),
  lng: z.number(),
  rdX: z.number().nullable(),
  rdY: z.number().nullable(),
  fullDisplay: z.string(),
});
export type PdokAddress = z.infer<typeof pdokAddressSchema>;
