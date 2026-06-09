import { useState } from "react";
import { ScrollView, Text, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/Colors";
import { Button } from "@/components/ui/Button";
import { AnalysisSummaryCard } from "@/components/reports/AnalysisSummaryCard";
import {
  AnalysisTabBar,
  type AnalysisTab,
} from "@/components/reports/AnalysisTabBar";
import { LabValueRow } from "@/components/reports/LabValueRow";
import { AIExplanationCard } from "@/components/reports/AIExplanationCard";
import { useLang } from "@/context/Languagecontext";
import type { LabValue } from "@/types";
import type { ApiSummary } from "@/types/Report/reportype";

export default function AnalysisScreen() {
  const { t } = useLang();
  const [tab, setTab] = useState<AnalysisTab>("Summary");

  const params = useLocalSearchParams<{
    reportId?: string;
    patientName?: string;
    hospitalName?: string;
    summary?: string;
    values?: string;
  }>();

  const values: LabValue[] = params.values ? JSON.parse(params.values) : [];
  const abnormal = values.filter(
    (v) => v.status === "high" || v.status === "low",
  );

  const visible = tab === "Abnormal" ? abnormal : values;

  // Parse summary once to extract new fields for AnalysisSummaryCard
  let parsedSummary: ApiSummary | null = null;
  if (params.summary) {
    try {
      parsedSummary = JSON.parse(params.summary);
    } catch {
      /* plain string */
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      {params.patientName ? (
        <Text style={styles.meta}>
          {params.patientName} · {params.hospitalName}
        </Text>
      ) : null}

      {/* Summary card with health score & condition severity */}
      <AnalysisSummaryCard
        abnormalCount={abnormal.length}
        totalCount={values.length}
        abnormalValues={abnormal}
        healthScore={parsedSummary?.health_score}
        conditionSeverity={parsedSummary?.condition_severity}
        conditionColor={parsedSummary?.condition_color}
      />

      <AnalysisTabBar
        active={tab}
        onChange={setTab}
        abnormalCount={abnormal.length}
      />

      {tab === "Summary" ? (
        <AIExplanationCard text={params.summary} />
      ) : (
        <>
          {visible.length === 0 ? (
            <Text style={styles.empty}>No values to show.</Text>
          ) : (
            visible.map((v) => (
              <LabValueRow key={v.name} value={v} variant="compact" />
            ))
          )}
        </>
      )}

      <Button
        title={t("see_all_values")}
        variant="outline"
        onPress={() =>
          router.push({
            pathname: "/all-values",
            params: { values: params.values },
          })
        }
      />
      <Button
        title={t("discuss_ai")}
        onPress={() => router.push("/(tabs)/ai")}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  meta: { fontSize: 13, color: Colors.textMuted, textAlign: "center" },
  empty: { color: Colors.textMuted, textAlign: "center", paddingVertical: 24 },
});
