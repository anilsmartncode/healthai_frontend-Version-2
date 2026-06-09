import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/Colors";
import { Card } from "@/components/ui/Card";
import { LabValueRow } from "@/components/reports/LabValueRow";
import { useLang } from "@/context/Languagecontext";
import type { LabValue } from "@/types";

export default function AllValuesScreen() {
  const { t } = useLang();
  const params = useLocalSearchParams<{ values?: string }>();
  const values: LabValue[] = params.values ? JSON.parse(params.values) : [];

  const hasAbnormal = values.some((v) => v.status !== "normal");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 10 }}
    >
      <Text style={styles.title}>{t("all_values")}</Text>
      <Text style={styles.sub}>{t("all_values_sub")}</Text>

      <View style={styles.headerRow}>
        <Text style={[styles.cell, styles.h, { flex: 1.2 }]}>Test Name</Text>
        <Text style={[styles.cell, styles.h]}>Value</Text>
        <Text style={[styles.cell, styles.h, { flex: 1.4 }]}>Range</Text>
        <Text style={[styles.cell, styles.h]}>Status</Text>
      </View>

      {values.map((v) => (
        <LabValueRow key={v.name} value={v} variant="full" />
      ))}

      {hasAbnormal && (
        <Card style={{ backgroundColor: "#FEF3C7", borderColor: "#FCD34D" }}>
          <Text style={{ color: "#92400E" }}>
            High/Low values should be discussed with your physician.
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: Colors.text },
  sub: { color: Colors.textMuted, marginBottom: 8 },
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cell: { flex: 1, fontSize: 13, color: Colors.text },
  h: {
    fontWeight: "700",
    color: Colors.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
  },
});
