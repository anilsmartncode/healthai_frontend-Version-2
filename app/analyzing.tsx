import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";

export default function Analyzing() {
  const { t } = useLang();
  // Receive params forwarded from the upload screen
  const params = useLocalSearchParams<{
    reportId?: string;
    patientName?: string;
    hospitalName?: string;
    summary?: string;
    values?: string;
    detectedMedicines?: string;
  }>();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace({
        pathname: "/analysis",
        params: {
          reportId:          params.reportId,
          patientName:       params.patientName,
          hospitalName:      params.hospitalName,
          summary:           params.summary,
          values:            params.values,
          detectedMedicines: params.detectedMedicines,
        },
      });
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.c}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.title}>{t("analyzing_title")}</Text>
      <Text style={styles.sub}>{t("analyzing_sub")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  c: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
    backgroundColor: Colors.bg,
  },
  title: { fontSize: 18, fontWeight: "700", color: Colors.text },
  sub: { color: Colors.textMuted, textAlign: "center" },
});
