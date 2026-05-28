import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";

interface Props {
  attentionCount?: number;
  avatarSource?: { uri: string } | number;
}

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", emoji: "🌅" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "☀️" };
  return { text: "Good Evening", emoji: "🌙" };
}

/** "anil.kumar@gmail.com" → "Anil Kumar", "surya" → "Surya" */
function formatName(raw: string): string {
  const local = raw.includes("@") ? raw.split("@")[0] : raw;
  return local
    .split(/[._\-\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** "Anil Kumar" → "AK", "surya" → "S" */
function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

/** Deterministic pastel bg color based on name */
function getAvatarColor(name: string): string {
  const COLORS = [
    { bg: "#EEF0FF", text: "#4F5BD5" },
    { bg: "#FEF0FF", text: "#9333EA" },
    { bg: "#FFF0F0", text: "#E53E3E" },
    { bg: "#F0FFF4", text: "#38A169" },
    { bg: "#FFF7ED", text: "#DD6B20" },
    { bg: "#EBF8FF", text: "#3182CE" },
  ];
  const index =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % COLORS.length;
  return COLORS[index].bg + "|" + COLORS[index].text;
}

export function HomeHeader({ attentionCount = 0, avatarSource }: Props) {
  const { phone } = useAuth();
  const userName = formatName(phone ?? "User");
  const { text: greetingText, emoji } = getGreeting();
  const initials = getInitials(userName);
  const [bgColor, textColor] = getAvatarColor(userName).split("|");

  return (
    <View style={styles.container}>
      {/* ── Avatar ── */}
      <Pressable
        onPress={() => router.push("/profile")}
        style={styles.avatarWrap}
      >
        {avatarSource ? (
          <Image source={avatarSource} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: bgColor }]}>
            <Text style={[styles.initials, { color: textColor }]}>
              {initials}
            </Text>
          </View>
        )}
      </Pressable>

      {/* ── Greeting + Name ── */}
      <View style={styles.textBlock}>
        <Text style={styles.greeting}>{greetingText},</Text>
        <Text style={styles.name} numberOfLines={1}>
          {userName} {emoji}
        </Text>
      </View>

      {/* ── Notification bell with badge ── */}
      <Pressable
        onPress={() => router.push("/notifications")}
        hitSlop={8}
        style={styles.bellWrap}
      >
        <Ionicons name="notifications-outline" size={24} color={Colors.text} />
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
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: "#A0AEC0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarWrap: { flexShrink: 0 },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: "#E8EAFF",
  },
  avatarFallback: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: "#E8EAFF",
    justifyContent: "center",
    alignItems: "center",
  },
  initials: { fontSize: 22, fontWeight: "800", letterSpacing: 1 },
  textBlock: { flex: 1, minWidth: 0, gap: 3 },
  greeting: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    letterSpacing: 0.2,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E2D5A",
    letterSpacing: -0.3,
  },
  bellWrap: {
    flexShrink: 0,
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
