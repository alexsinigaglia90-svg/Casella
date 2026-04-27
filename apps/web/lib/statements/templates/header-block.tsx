import "server-only";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 8 },
  employer: { fontSize: 11, marginBottom: 2 },
  meta: { fontSize: 10, color: "#444" },
});

export interface HeaderBlockProps {
  employer: { name: string; kvk: string; address: string };
}

export function HeaderBlock({ employer }: HeaderBlockProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Werkgeversverklaring</Text>
      <Text style={styles.employer}>{employer.name}</Text>
      <Text style={styles.meta}>KvK {employer.kvk}</Text>
      <Text style={styles.meta}>{employer.address}</Text>
    </View>
  );
}
