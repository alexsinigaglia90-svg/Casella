import { pgTable, integer, numeric } from "drizzle-orm/pg-core";

export const bonusConfig = pgTable("bonus_config", {
  year: integer("year").primaryKey(),
  werkgeverslastenPct: numeric("werkgeverslasten_pct", {
    precision: 5,
    scale: 2,
  })
    .notNull()
    .default("30.00"),
  indirecteKostenPerMaand: numeric("indirecte_kosten_per_maand", {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default("500.00"),
  werkbareUrenPerMaand: integer("werkbare_uren_per_maand")
    .notNull()
    .default(168),
});
