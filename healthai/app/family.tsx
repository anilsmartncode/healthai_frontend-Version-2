import { ScrollView, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { MedCard } from "@/components/medicines/MedCard";
import { Colors } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";

const FAMILY = [
  { name: "You", score: 82, color: "#16A34A" },
  { name: "Lopa", score: 74, color: "#F59E0B" },
  { name: "Dad", score: 60, color: "#DC2626" },
  { name: "Mom", score: 75, color: "#F59E0B" },
];

const MEDS = [
  {
    time: "08:00",
    name: "Atorvastatin 10mg",
    note: "Before Food",
    taken: true,
  },
  { time: "09:00", name: "Amlukalyam D3", note: "After Dinner", taken: false },
];

export default function FamilyScreen() {
  const { t } = useLang();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 14 }}
    >
      <Text style={styles.title}>{t("care_hub_title")}</Text>

      <Text style={styles.section}>{t("family")}</Text>
      <View style={styles.familyRow}>
        {FAMILY.map((m) => (
          <View key={m.name} style={styles.member}>
            <View style={[styles.avatar, { borderColor: m.color }]}>
              <Ionicons name="person" size={22} color={m.color} />
            </View>
            <Text style={styles.memName}>{m.name}</Text>
            <Text style={[styles.memScore, { color: m.color }]}>
              {m.score}%
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>{t("medications")}</Text>
      {MEDS.map((m) => (
        <MedCard key={m.name} med={m} />
      ))}

      <Text style={styles.section}>{t("trends")}</Text>
      <Card>
        <Text style={{ color: Colors.textMuted, marginBottom: 8 }}>
          TSH Trend (6 Months)
        </Text>
        <View style={styles.chart}>
          {[5, 6.5, 7.2, 6.8, 7.5, 8.2].map((v, i) => (
            <View key={i} style={{ alignItems: "center", gap: 4 }}>
              <View style={[styles.bar, { height: v * 8 }]} />
              <Text style={styles.day}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}
              </Text>
            </View>
          ))}
        </View>
        <Text style={{ color: Colors.danger, fontWeight: "700", marginTop: 8 }}>
          Latest: 8.20
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: Colors.text },
  section: { fontWeight: "700", color: Colors.text, marginTop: 8 },
  familyRow: { flexDirection: "row", justifyContent: "space-between" },
  member: { alignItems: "center", gap: 4 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  memName: { color: Colors.text, fontSize: 13 },
  memScore: { fontSize: 12, fontWeight: "700" },
  chart: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 90,
  },
  bar: { width: 18, borderRadius: 4, backgroundColor: Colors.primary },
  day: { fontSize: 11, color: Colors.textMuted },
});
