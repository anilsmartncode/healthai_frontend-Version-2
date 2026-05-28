import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { HealthScore } from "@/components/common/HealthScore";
import { ReportItem } from "@/components/common/ReportItem";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/Colors";
import { useReports } from "@/hooks/useReports";

export default function Home() {
  const { data: reports } = useReports();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView contentContainerStyle={styles.c}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greet}>Good Morning, Anil 👋</Text>
            <Text style={styles.sub}>Here's your health summary</Text>
          </View>
          <Pressable onPress={() => router.push("/notifications")}>
            <Ionicons
              name="notifications-outline"
              size={26}
              color={Colors.text}
            />
          </Pressable>
        </View>

        <Card style={{ alignItems: "center", gap: 12 }}>
          <HealthScore score={82} />
          <Text style={styles.summaryTitle}>AI Summary</Text>
          <Text style={styles.summaryItem}>• 2 values need attention</Text>
          <Text style={styles.summaryItem}>• 1 value is low</Text>
          <Text style={styles.summaryItem}>• All other values are normal</Text>
        </Card>

        <Button
          title="+  Upload New Report"
          onPress={() => router.push("/upload")}
        />

        <Pressable onPress={() => router.push("/family")}>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Ionicons name="people-outline" size={28} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: Colors.text }}>
                Family Health
              </Text>
              <Text style={{ color: Colors.textMuted, fontSize: 12 }}>
                Care Hub: meds, members & trends
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.textMuted}
            />
          </Card>
        </Pressable>

        <View style={styles.row}>
          <Text style={styles.section}>Recent Reports</Text>
          <Pressable onPress={() => router.push("/(tabs)/reports")}>
            <Text style={{ color: Colors.primary }}>View All</Text>
          </Pressable>
        </View>

        {reports.map((r) => (
          <Pressable key={r.id} onPress={() => router.push("/analysis")}>
            <ReportItem report={r} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  c: { padding: 16, gap: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greet: { fontSize: 20, fontWeight: "700", color: Colors.text },
  sub: { color: Colors.textMuted },
  summaryTitle: { fontWeight: "700", color: Colors.text, marginTop: 8 },
  summaryItem: { color: Colors.textMuted, alignSelf: "flex-start" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  section: { fontSize: 16, fontWeight: "700", color: Colors.text },
});
