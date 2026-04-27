import "server-only";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import { FooterBlock } from "./footer-block";
import { HeaderBlock } from "./header-block";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  section: { marginBottom: 14 },
  h2: { fontSize: 13, fontWeight: 700, marginBottom: 6 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 180, color: "#444" },
  value: { flex: 1 },
});

export interface MortgageTemplateProps {
  employer: { name: string; kvk: string; address: string };
  employee: {
    fullName: string;
    jobTitle: string;
    startDate: string;
    endDate: string | null;
    brutoSalarisMaandCents: number | null;
    vakantietoeslagPct: string | null;
  };
  signature: { signedBy: string; signedAt: string; locationCity?: string };
  purposeData: {
    nhgIndicator?: boolean | null;
    lenderName?: string | null;
    loanAmountIndicativeCents?: number | null;
  };
}

function formatEur(cents: number | null): string {
  if (cents == null) return "—";
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export function MortgageTemplate(props: MortgageTemplateProps) {
  const { employer, employee, signature, purposeData } = props;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <HeaderBlock employer={employer} />

        <View style={styles.section}>
          <Text style={styles.h2}>Doel</Text>
          <Text>Hypotheek-aanvraag</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Werknemer</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Naam</Text>
            <Text style={styles.value}>{employee.fullName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Functie</Text>
            <Text style={styles.value}>{employee.jobTitle}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>In dienst sinds</Text>
            <Text style={styles.value}>{employee.startDate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Einddatum</Text>
            <Text style={styles.value}>{employee.endDate ?? "Onbepaalde tijd"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Bruto salaris / mnd</Text>
            <Text style={styles.value}>{formatEur(employee.brutoSalarisMaandCents)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Vakantietoeslag</Text>
            <Text style={styles.value}>{employee.vakantietoeslagPct ?? "8.00"}%</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.h2}>Hypotheek-gegevens</Text>
          <View style={styles.row}>
            <Text style={styles.label}>NHG-indicatie</Text>
            <Text style={styles.value}>
              {purposeData.nhgIndicator ? "Ja" : "Nee"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Geldverstrekker</Text>
            <Text style={styles.value}>{purposeData.lenderName ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Indicatief leenbedrag</Text>
            <Text style={styles.value}>
              {formatEur(purposeData.loanAmountIndicativeCents ?? null)}
            </Text>
          </View>
        </View>

        <FooterBlock {...signature} />
      </Page>
    </Document>
  );
}
