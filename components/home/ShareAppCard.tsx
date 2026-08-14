import React from "react";
import { View, Text, StyleSheet, Pressable, Share, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";
import { Strings } from "@/constants/Strings";

export function ShareAppCard() {
  const { t } = useLang();

  const handleShare = async () => {
    try {
      await Share.share({
        message: t("share_message") + Strings.appDownloadLink,
      });
    } catch (err: any) {
      console.log("[ShareAppCard] Native sharing failed:", err.message);
    }
  };

  return (
    <Pressable
      onPress={handleShare}
      accessibilityRole="button"
      accessibilityLabel={t("share_card_title")}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.card}>
        {/* Left Icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="gift-outline" size={20} color="#6366F1" />
        </View>

        {/* Middle Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{t("share_card_title")}</Text>
          <Text style={styles.subtitle}>{t("share_card_desc")}</Text>
        </View>

        {/* Right Action Button */}
        <View style={styles.actionPill}>
          <Text style={styles.actionPillText}>Refer</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#F5F3FF", // Soft premium violet/indigo tint
    borderRadius: Radius.xl,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#DDD6FE",
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#312E81", // Deep indigo
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  actionPill: {
    backgroundColor: "#6366F1", // Vibrant indigo button
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
  },
  actionPillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});

