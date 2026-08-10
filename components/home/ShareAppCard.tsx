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
        {/* Centered Glowing Icon Badge */}
        <View style={styles.iconContainer}>
          <View style={styles.iconGlow} />
          <View style={styles.iconWrap}>
            <Ionicons name="gift-outline" size={24} color="#6366F1" />
          </View>
        </View>

        {/* Centered Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{t("share_card_title")}</Text>
          <Text style={styles.subtitle}>{t("share_card_desc")}</Text>
        </View>

        {/* Eye-Catchy Action Pill Button */}
        <View style={styles.actionPill}>
          <Ionicons name="share-social" size={16} color="#FFFFFF" />
          <Text style={styles.actionPillText}>Refer Friends</Text>
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
    backgroundColor: "#F5F3FF", // Soft premium violet/indigo tint
    borderRadius: Radius.xl,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#DDD6FE",
    ...Platform.select({
      ios: {
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconGlow: {
    position: "absolute",
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#E0E7FF",
    opacity: 0.6,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    ...Platform.select({
      ios: {
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#312E81", // Deep indigo
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 320,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1", // Vibrant indigo button
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: Radius.pill,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionPillText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});

