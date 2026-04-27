import "server-only";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  footer: {
    marginTop: 30,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#000",
  },
  line: { fontSize: 11, marginBottom: 4 },
  badge: { fontSize: 9, color: "#666", marginTop: 8 },
});

export interface FooterBlockProps {
  signedBy: string;
  signedAt: string;
  locationCity?: string;
}

export function FooterBlock({ signedBy, signedAt, locationCity }: FooterBlockProps) {
  return (
    <View style={styles.footer}>
      <Text style={styles.line}>
        Getekend te {locationCity ?? "Den Haag"}, {signedAt}
      </Text>
      <Text style={styles.line}>Namens werkgever: {signedBy}</Text>
      <Text style={styles.badge}>[Casella] auto-generated document</Text>
    </View>
  );
}
