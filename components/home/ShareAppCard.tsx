import React from "react";
import { View, Text, StyleSheet, Pressable, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";
import { Card } from "@/components/ui/Card";
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
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="share-outline" size={20} color="#6366F1" />
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{t("share_card_title")}</Text>
          <Text style={styles.subtitle}>{t("share_card_desc")}</Text>
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
    backgroundColor: "#EEF2FF",
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
    lineHeight: 16,
  },
});
