"use server";

interface KvkResult {
  name: string;
  address: {
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
  };
}

const KVK_MOCK: Record<string, KvkResult> = {
  "17071698": {
    name: "Vanderlande Industries",
    address: {
      street: "Vanderlandelaan",
      houseNumber: "2",
      postalCode: "5466 RB",
      city: "Veghel",
    },
  },
  "27124700": {
    name: "PostNL",
    address: {
      street: "Prinses Beatrixlaan",
      houseNumber: "23",
      postalCode: "2595 AK",
      city: "Den Haag",
    },
  },
  "32058645": {
    name: "Jumbo Supermarkten",
    address: {
      street: "Rijksweg",
      houseNumber: "15",
      postalCode: "5462 GD",
      city: "Veghel",
    },
  },
  "17085815": {
    name: "ASML Holding",
    address: {
      street: "De Run",
      houseNumber: "6501",
      postalCode: "5504 DR",
      city: "Veldhoven",
    },
  },
  "32100286": {
    name: "bol.com",
    address: {
      street: "Papendorpseweg",
      houseNumber: "100",
      postalCode: "3528 BJ",
      city: "Utrecht",
    },
  },
  "33014286": {
    name: "KLM Royal Dutch Airlines",
    address: {
      street: "Amsterdamseweg",
      houseNumber: "55",
      postalCode: "1182 GP",
      city: "Amstelveen",
    },
  },
  "33011433": {
    name: "Heineken Nederland",
    address: {
      street: "Tweede Weteringplantsoen",
      houseNumber: "21",
      postalCode: "1017 ZD",
      city: "Amsterdam",
    },
  },
  "34276373": {
    name: "Albert Heijn",
    address: {
      street: "Provincialeweg",
      houseNumber: "11",
      postalCode: "1506 MA",
      city: "Zaandam",
    },
  },
};

// TODO: Vervang door echte KvK Handelsregister API (vereist API-key + commercieel quotum)
export async function lookupKvk(kvk: string): Promise<KvkResult | null> {
  const cleaned = kvk.replace(/\s/g, "");
  return KVK_MOCK[cleaned] ?? null;
}
