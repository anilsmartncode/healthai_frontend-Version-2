import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";
import { Card } from "@/components/ui/Card";
import { useLang } from "@/context/Languagecontext";

export interface RiskIndicator {
  label: string;
  level: "low" | "moderate" | "high";
  disease: string;
}

interface Props {
  riskIndicators: RiskIndicator[];
  hasReports: boolean;
}

export function RiskIndicatorsSection({ riskIndicators, hasReports }: Props) {
  const { t } = useLang();

  // Hide section completely when no risk data is available
  if (!riskIndicators || riskIndicators.length === 0) {
    return null;
  }

  // Primary list to display when no reports/data are available
  const defaultRisks = [
    { label: "Diabetes", level: null, icon: "analytics-outline" },
    { label: "Heart Disease", level: null, icon: "heart-outline" },
    { label: "Vitamin D Deficiency", level: null, icon: "sunny-outline" },
  ];

  const getLevelDetails = (level: "low" | "moderate" | "high" | null) => {
    if (!level) {
      return {
        bg: "#F3F4F6",
        text: "#6B7280",
        label: t("no_data"),
      };
    }
    switch (level) {
      case "low":
        return {
          bg: "#DCFCE7",
          text: "#15803D",
          label: t("risk_low"),
        };
      case "moderate":
        return {
          bg: "#FEF3C7",
          text: "#B45309",
          label: t("risk_moderate"),
        };
      case "high":
        return {
          bg: "#FEE2E2",
          text: "#B91C1C",
          label: t("risk_high"),
        };
    }
  };

  const getRiskIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("diabet")) return "analytics-outline";
    if (l.includes("heart") || l.includes("cardio")) return "heart-outline";
    return "sunny-outline";
  };

  const itemsToRender = hasReports && riskIndicators.length > 0
    ? riskIndicators.map((r) => ({
        label: r.label,
        level: r.level,
        icon: getRiskIcon(r.label),
      }))
    : defaultRisks;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>{t("risk_assessment")}</Text>

      <Card style={styles.card}>
        {itemsToRender.map((item, idx) => {
          const details = getLevelDetails(item.level);
          return (
            <View
              key={item.label}
              style={[
                styles.row,
                idx === itemsToRender.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.leftCol}>
                <Ionicons name={item.icon as any} size={18} color={Colors.primary} />
                <Text style={styles.label}>{item.label}</Text>
              </View>

              <View style={[styles.badge, { backgroundColor: details.bg }]}>
                <Text style={[styles.badgeText, { color: details.text }]}>
                  {details.label}
                </Text>
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  card: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  leftCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
});

