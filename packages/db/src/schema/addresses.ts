import {
  pgTable,
  uuid,
  text,
  timestamp,
  doublePrecision,
  integer,
  unique,
} from "drizzle-orm/pg-core";

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pdokId: text("pdok_id"),
    street: text("street").notNull(),
    houseNumber: text("house_number").notNull(),
    houseNumberAddition: text("house_number_addition"),
    postalCode: text("postal_code").notNull(),
    city: text("city").notNull(),
    municipality: text("municipality"),
    province: text("province"),
    country: text("country").notNull().default("NL"),
    fullAddressDisplay: text("full_address_display"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    rdX: doublePrecision("rd_x"),
    rdY: doublePrecision("rd_y"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    pdokIdUnique: unique().on(t.pdokId),
  }),
);

export const routeCache = pgTable(
  "route_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromAddressId: uuid("from_address_id")
      .notNull()
      .references(() => addresses.id, { onDelete: "cascade" }),
    toAddressId: uuid("to_address_id")
      .notNull()
      .references(() => addresses.id, { onDelete: "cascade" }),
    distanceKm: doublePrecision("distance_km").notNull(),
    durationSec: integer("duration_sec").notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqueRoute: unique().on(t.fromAddressId, t.toAddressId),
  })
);
