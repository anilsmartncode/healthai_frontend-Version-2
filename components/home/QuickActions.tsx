import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import React from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";

const SCREEN_W = Dimensions.get("window").width;
const CONTAINER_PADDING = 16;
const GAP = 4;
const ITEM_WIDTH = (SCREEN_W - (CONTAINER_PADDING * 2) - (GAP * 5)) / 6;

type ActionItem = {
  emoji?: string;
  ionicon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  route: string;
};

export function QuickActions() {
  const { t } = useLang();

  const actions: ActionItem[] = [
    {
      ionicon: "chatbubbles-outline",
      iconColor: "#0D7B5F",
      label: t("ask_ai") || "Ask AI",
      route: "/ai",
    },
    {
      emoji: "💊",
      label: t("action_meds") || "Meds",
      route: "/medicines",
    },
    {
      emoji: "📅",
      label: (t as any)("action_book_visit") || "Book visit",
      route: "/appointments",
    },
    {
      emoji: "🆘",
      label: t("action_sos") || "SOS",
      route: "/family/emergency",
    },
    {
      emoji: "🖤",
      label: t("action_vitals") || "Vitals",
      route: "/vitals",
    },
    {
      emoji: "⏱️",
      label: t("action_timeline") || "Timeline",
      route: "/timeline",
    },
    {
      emoji: "💉",
      label: (t as any)("action_vaccines") || "Vaccines",
      route: "/vaccines",
    },
    {
      ionicon: "sync-circle-outline",
      iconColor: "#0D7B5F",
      label: (t as any)("action_interactions") || "Interactions",
      route: "/medicines/check-interactions",
    },
    {
      emoji: "🗃️",
      label: t("action_vault") || "Vault",
      route: "/vault",
    },
    {
      ionicon: "people",
      iconColor: "#FF9500",
      label: t("action_family") || "Family",
      route: "/family",
    },
    {
      emoji: "👨‍⚕️",
      label: t("action_add_doctor") || "Add doctor",
      route: "/doctors",
    },
    {
      ionicon: "arrow-up",
      iconColor: "#0F172A",
      label: (t as any)("action_upload_prescription") || "Upload prescription",
      route: "/medicines",
    },
  ];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>{t("quick_actions")}</Text>

      <View style={styles.gridContainer}>
        {actions.map((a, i) => (
          <Pressable
            key={i}
            style={({ pressed }) => [styles.listItem, pressed && styles.pressed, { width: ITEM_WIDTH }]}
            onPress={() => {
              try {
                router.push(a.route as any);
              } catch (e) {
                console.log("Route not found");
              }
            }}
          >
            <View style={styles.iconWrap}>
              {a.ionicon ? (
                <Ionicons name={a.ionicon} size={19} color={a.iconColor || Colors.primary} />
              ) : (
                <Text style={styles.emojiText}>{a.emoji}</Text>
              )}
            </View>
            <Text
              style={styles.label}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {a.label}
            </Text>
          </Pressable>
        ))}
      </View>
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
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  listItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 64,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  iconWrap: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiText: {
    fontSize: 17,
  },
  label: {
    fontSize: 8.5,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 11,
    letterSpacing: -0.2,
  },
});
