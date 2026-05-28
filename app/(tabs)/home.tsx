import { View, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Radius } from "@/constants/Colors";
import { useReports } from "@/hooks/useReports"; // already direct — good
import { Button } from "@/components/ui/Button";

import { HomeHeader } from "@/components/home/HomeHeader";
import { HealthScoreCard } from "@/components/home/Healthscorecard";
import { FamilyHealthCard } from "@/components/home/Familyhealthcard";
import { RecentReports } from "@/components/home/RecentReports";

export default function Home() {
  const { data: reports } = useReports();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Fixed header — never scrolls */}
      <View style={styles.header}>
        <HomeHeader attentionCount={2} />
      </View>

      {/* Scrollable body fills remaining space */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <HealthScoreCard score={82} label="Good" attentionCount={2} />
        <Button
          title="+ Upload Report"
          onPress={() => router.push("/upload")}
          style={styles.uploadBtn}
        />
        <FamilyHealthCard />
        <RecentReports reports={reports} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  scroll: {
    flex: 1, // fills all remaining vertical space
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 14,
    flexGrow: 1, // allows content to stretch on tall screens
  },
  uploadBtn: {
    borderRadius: Radius.lg,
    paddingVertical: 16,
  },
});
