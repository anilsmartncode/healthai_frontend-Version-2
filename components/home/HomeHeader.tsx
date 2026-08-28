import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Share } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';
import { useLang } from "@/context/Languagecontext";
import { Strings } from "@/constants/Strings";
import { useNotifications } from "@/hooks/useNotifications";

interface Props { }

function getGreeting(t: (k: any) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t("good_morning");
  if (hour < 17) return t("good_afternoon");
  return t("good_evening");
}

function formatName(raw: string): string {
  const local = raw.includes("@") ? raw.split("@")[0] : raw;
  return local
    .split(/[._\-\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function HomeHeader({ }: Props) {
  const { phone } = useAuth();
  const [userName, setUserName] = useState(formatName(phone ?? "User"));
  const { t, isRTL, rowDirection, textAlign } = useLang();
  const greetingText = getGreeting(t);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    const cacheKey = `healthai_profile_name_${phone ?? 'guest'}`;
    AsyncStorage.getItem(cacheKey).then(name => {
      if (name && name.trim()) setUserName(formatName(name.trim()));
    });
  }, [phone]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: t("share_message") + Strings.appDownloadLink,
      });
    } catch (err: any) {
      console.log("[HomeHeader] Native sharing failed:", err.message);
    }
  };

  return (
    <View style={[styles.container, { flexDirection: rowDirection }]}>
      {/* ── Greeting + Name (left) ── */}
      <View style={[styles.textBlock, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.greeting, { textAlign }]}>{greetingText}</Text>
        <Text style={[styles.name, { textAlign }]} numberOfLines={1}>
          {userName}
        </Text>
      </View>

      {/* ── Action Buttons (right) ── */}
      <View style={[styles.actionsRow, { flexDirection: rowDirection }]}>
        <Pressable
          onPress={handleShare}
          hitSlop={8}
          style={styles.inviteBtn}
        >
          <Ionicons name="gift" size={16} color="#4F46E5" />
          <Text style={styles.inviteBtnText}>{t("refer_friends")}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/notifications")}
          hitSlop={8}
          style={styles.actionBtn}
        >
          <Ionicons name="notifications-outline" size={20} color={Colors.text} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
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
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8F9FF",
    borderWidth: 1,
    borderColor: "#ECEEFF",
    justifyContent: "center",
    alignItems: "center",
  },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  inviteBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4338CA",
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