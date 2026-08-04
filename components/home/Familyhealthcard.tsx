import React from "react";
import { Pressable, View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";
import { Card } from "@/components/ui/Card";
import { useLang } from "@/context/Languagecontext";
import { useFamilyDashboard } from "@/hooks/useFamily";

export function FamilyHealthCard() {
  const { t } = useLang();
  const { dashboard, loading } = useFamilyDashboard();

  const members = dashboard?.members ?? [];
  const avgScore = dashboard?.family_health_score ?? 84;
  const scoreLabel = dashboard?.score_label ?? "Excellent";

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "#10B981"; // Excellent - Emerald
    if (score >= 75) return "#3B82F6"; // Good - Blue
    if (score >= 65) return "#F59E0B"; // Attention - Orange
    return "#EF4444"; // Critical - Red
  };

  return (
    <Pressable
      onPress={() => router.push("/family")}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.leftCol}>
            <View style={styles.titleRow}>
              <Ionicons name="people-outline" size={20} color={Colors.primary} />
              <Text style={styles.title}>{t("family_health")}</Text>
            </View>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
            ) : (
              <Text style={styles.subtitle}>
                {members.length} {members.length === 1 ? "member" : "members"} connected • Average: {avgScore} ({scoreLabel})
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </View>

        {!loading && (
          <View style={styles.avatarsRow}>
            {members.map((member) => {
              const initials = getInitials(member.name);
              const color = getScoreColor(member.health_score);

              return (
                <View key={member.member_id} style={styles.avatarContainer}>
                  <View style={[styles.avatar, { borderColor: color }]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                    <View style={[styles.scoreDot, { backgroundColor: color }]} />
                  </View>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {member.name}
                  </Text>
                </View>
              );
            })}

            <Pressable
              style={styles.avatarContainer}
              onPress={() => router.push('/family/add-member')}
            >
              <View style={[styles.avatar, { borderColor: '#CBD5E1', borderStyle: 'dashed', backgroundColor: '#F8FAFC' }]}>
                <Ionicons name="add" size={22} color="#94A3B8" />
              </View>
              <Text style={styles.memberName} numberOfLines={1}>
                Add family
              </Text>
            </Pressable>
          </View>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  card: {
    padding: 16,
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftCol: {
    gap: 4,
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  loader: {
    alignSelf: "flex-start",
    marginTop: 2,
  },
  avatarsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 2,
  },
  avatarContainer: {
    alignItems: "center",
    gap: 4,
    width: 60,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
  scoreDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  memberName: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textMuted,
    textAlign: "center",
  },
});
