import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';

interface Props {
  attentionCount?: number;
}

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", emoji: "👋" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "☀️" };
  return { text: "Good Evening", emoji: "🌙" };
}

function formatName(raw: string): string {
  const local = raw.includes("@") ? raw.split("@")[0] : raw;
  return local
    .split(/[._\-\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function HomeHeader({ attentionCount = 0 }: Props) {
  const { phone } = useAuth();
  const [userName, setUserName] = useState(formatName(phone ?? "User"));
  const { text: greetingText, emoji } = getGreeting();

  useEffect(() => {
    const cacheKey = `healthai_profile_name_${phone ?? 'guest'}`;
    AsyncStorage.getItem(cacheKey).then(name => {
      if (name && name.trim()) setUserName(name.trim());
    });
  }, [phone]);

  return (
    <View style={styles.container}>
      {/* ── Greeting + Name (left) ── */}
      <View style={styles.textBlock}>
        <Text style={styles.greeting}>{greetingText},</Text>
        <Text style={styles.name} numberOfLines={1}>
          {userName} {emoji}
        </Text>
      </View>

      {/* ── Notification bell with badge (right) ── */}
      <Pressable
        onPress={() => router.push("/notifications")}
        hitSlop={8}
        style={styles.bellWrap}
      >
        <Ionicons name="notifications-outline" size={22} color={Colors.text} />
        {attentionCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{attentionCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  textBlock: { flex: 1, minWidth: 0, gap: 2 },
  greeting: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.5,
  },
  bellWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F8F9FF",
    borderWidth: 1,
    borderColor: "#ECEEFF",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
});