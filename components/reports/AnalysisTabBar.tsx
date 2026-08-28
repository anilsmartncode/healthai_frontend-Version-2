import { View, Text, StyleSheet, Pressable } from "react-native";
import { Colors } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";

export const ANALYSIS_TABS = ["Summary", "Abnormal", "All Values"] as const;
export type AnalysisTab = (typeof ANALYSIS_TABS)[number];

interface Props {
  active: AnalysisTab;
  onChange: (tab: AnalysisTab) => void;
  abnormalCount?: number;
}

export function AnalysisTabBar({ active, onChange, abnormalCount = 0 }: Props) {
  const { t, rowDirection } = useLang();

  const labels: Record<AnalysisTab, string> = {
    Summary: t("summary"),
    Abnormal: `${t("abnormal")} (${abnormalCount})`,
    "All Values": t("all_values"),
  };

  return (
    <View style={[styles.tabs, { flexDirection: rowDirection }]}>
      {ANALYSIS_TABS.map((tabKey) => (
        <Pressable
          key={tabKey}
          onPress={() => onChange(tabKey)}
          style={[styles.tab, active === tabKey && styles.tabActive]}
        >
          <Text
            style={[styles.tabText, active === tabKey && { color: Colors.primary }]}
          >
            {labels[tabKey]}
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
