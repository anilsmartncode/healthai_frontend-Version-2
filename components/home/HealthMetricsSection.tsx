import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Radius } from "@/constants/Colors";
import { Card } from "@/components/ui/Card";
import { useLang } from "@/context/Languagecontext";
import { reportsApi, type ReportListItem, type AnalyzeResult } from "@/services/reportsApi";

interface Props {
  reports: ReportListItem[];
  phone: string | null;
}

export function HealthMetricsSection({ reports, phone }: Props) {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [latestDetail, setLatestDetail] = useState<AnalyzeResult | null>(null);

  useEffect(() => {
    if (reports.length > 0) {
      setLoading(true);
      const latestReportId = reports[0].id;
      reportsApi.getById(latestReportId, phone)
        .then((detail) => {
          if (detail) {
            setLatestDetail(detail as AnalyzeResult);
          }
        })
        .catch((err) => {
          console.log("[HealthMetricsSection] Failed to load latest report detail:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLatestDetail(null);
    }
  }, [reports, phone]);

  const findValue = (names: string[]) => {
    if (!latestDetail || !latestDetail.values) return null;
    return latestDetail.values.find((v) =>
      names.some((name) => v.name.toLowerCase().includes(name.toLowerCase()))
    );
  };

  const metrics = [
    {
      key: "blood_sugar",
      label: t("blood_sugar"),
      icon: "water-outline" as const,
      color: "#EF4444",
      bgColor: "#FEF2F2",
      defaultVal: "--",
      defaultUnit: "mg/dL",
      extracted: findValue(["glucose", "hba1c", "sugar", "fbs", "ppbs"]),
    },
    {
      key: "cholesterol",
      label: t("cholesterol"),
      icon: "heart-outline" as const,
      color: "#EC4899",
      bgColor: "#FDF2F8",
      defaultVal: "--",
      defaultUnit: "mg/dL",
      extracted: findValue(["cholesterol", "ldl", "hdl", "lipid"]),
    },
    {
      key: "vitamin_d",
      label: t("vitamin_d"),
      icon: "sunny-outline" as const,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
      defaultVal: "--",
      defaultUnit: "ng/mL",
      extracted: findValue(["vitamin d", "vit d", "25-hydroxy", "25 oh"]),
    },
    {
      key: "hemoglobin",
      label: t("hemoglobin"),
      icon: "pulse-outline" as const,
      color: "#10B981",
      bgColor: "#ECFDF5",
      defaultVal: "--",
      defaultUnit: "g/dL",
      extracted: findValue(["hemoglobin", "hb", "hemo"]),
    },
  ];

  const handlePress = () => {
    if (reports.length > 0) {
      // Go to latest report detail
      router.push({
        pathname: "/report-detail",
        params: { id: reports[0].id },
      });
    } else {
      // Go to upload screen
      router.push("/upload");
    }
  };

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === "good" || s === "normal") {
      return {
        bg: "#DCFCE7",
        text: "#15803D",
        label: t("normal"),
      };
    }
    return {
      bg: "#FEE2E2",
      text: "#B91C1C",
      label: t("attention"),
    };
  };

  const activeMetrics = metrics.filter((m) => !!m.extracted);

  if (activeMetrics.length === 0) {
    const onboardDesc = reports.length > 0
      ? t("metric_no_biomarkers_desc")
      : t("metric_onboard_desc");

    return (
      <View style={styles.wrapper}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>{t("key_health_metrics")}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.onboardCard, pressed && styles.pressed]}
          onPress={() => router.push("/upload")}
        >
          <View style={styles.onboardLeft}>
            <View style={styles.onboardTitleRow}>
              <Ionicons name="analytics-outline" size={18} color={Colors.primary} />
              <Text style={styles.onboardTitle}>{t("metric_onboard_title")}</Text>
            </View>
            <Text style={styles.onboardText}>
              {onboardDesc}
            </Text>

            <View style={styles.miniIconsRow}>
              {metrics.map((m) => (
                <View key={m.key} style={styles.miniIconBg}>
                  <Ionicons name={m.icon} size={14} color={m.color} />
                </View>
              ))}
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={styles.chevron} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>{t("key_health_metrics")}</Text>
        {loading && <ActivityIndicator size="small" color={Colors.primary} />}
      </View>

      <View style={styles.grid}>
        {activeMetrics.map((m, index) => {
          const displayVal = m.extracted!.value;
          const displayUnit = ""; // parsed values have units built-in
          const status = m.extracted!.status;
          const statusStyle = status ? getStatusStyle(status) : null;
          const isSingle = activeMetrics.length === 1;
          const isLastOddCard = activeMetrics.length % 2 !== 0 && index === activeMetrics.length - 1;
          const isCentered = isSingle || isLastOddCard;

          return (
            <Pressable
              key={m.key}
              style={({ pressed }) => [
                styles.card,
                isSingle && styles.fullWidthCard,
                isCentered && styles.centeredCard,
                pressed && styles.pressed,
              ]}
              onPress={handlePress}
            >
              <View style={[styles.cardHeader, isCentered && styles.centeredCardHeader]}>
                <View style={[styles.iconWrap, { backgroundColor: m.bgColor }]}>
                  <Ionicons name={m.icon} size={20} color={m.color} />
                </View>
                {statusStyle && (
                  <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                      {statusStyle.label}
                    </Text>
                  </View>
                )}
              </View>

              <View style={[styles.valueContainer, isCentered && styles.centeredValueContainer]}>
                <Text style={styles.value}>{displayVal}</Text>
                {displayUnit && <Text style={styles.unit}>{displayUnit}</Text>}
              </View>

              <Text style={[styles.label, isCentered && styles.centeredText]} numberOfLines={1}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  fullWidthCard: {
    width: "100%",
  },
  centeredCard: {
    alignItems: "center",
  },
  pressed: {
    opacity: 0.75,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  centeredCardHeader: {
    justifyContent: "center",
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    marginTop: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
  },
  unit: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  centeredValueContainer: {
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  centeredText: {
    textAlign: "center",
  },
  onboardCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    width: "100%",
  },
  onboardLeft: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  onboardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  onboardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  onboardText: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  miniIconsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  miniIconBg: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  chevron: {
    flexShrink: 0,
  },
});
