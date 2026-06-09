import { View, Text, StyleSheet, Pressable } from "react-native";
import { Colors } from "@/constants/Colors";

export const ANALYSIS_TABS = ["Summary", "Abnormal", "All Values"] as const;
export type AnalysisTab = (typeof ANALYSIS_TABS)[number];

interface Props {
  active: AnalysisTab;
  onChange: (tab: AnalysisTab) => void;
  abnormalCount?: number;
}

export function AnalysisTabBar({ active, onChange, abnormalCount = 0 }: Props) {
  const labels: Record<AnalysisTab, string> = {
    Summary: "Summary",
    Abnormal: `Abnormal (${abnormalCount})`,
    "All Values": "All Values",
  };

  return (
    <View style={styles.tabs}>
      {ANALYSIS_TABS.map((t) => (
        <Pressable
          key={t}
          onPress={() => onChange(t)}
          style={[styles.tab, active === t && styles.tabActive]}
        >
          <Text
            style={[styles.tabText, active === t && { color: Colors.primary }]}
          >
            {labels[t]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  tabActive: { borderColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontWeight: "600", fontSize: 12 },
});
