import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Radius } from "@/constants/Colors";
import { Card } from "@/components/ui/Card";
import { useLang } from "@/context/Languagecontext";

interface TodayBanner {
  count: number;
  nextName: string;
  nextTime: string;
}

interface Props {
  todayBanner: TodayBanner | null;
}

export function MedicineReminderCard({ todayBanner }: Props) {
  const { t } = useLang();

  // If no medicines are scheduled today, hide the widget entirely to save space
  if (!todayBanner || todayBanner.count === 0) {
    return null;
  }

  return (
    <Pressable
      onPress={() => router.push("/medicines/reminders")}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="time" size={20} color="#7C3AED" />
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{t("todays_medications")}</Text>
          <Text style={styles.subtitle}>
            {todayBanner.count} {t("due_today")} {todayBanner.nextName} at {todayBanner.nextTime}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F5F3FF",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500",
  },
});
