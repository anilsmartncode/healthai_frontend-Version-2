import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import React from "react";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";

const SCREEN_W = Dimensions.get("window").width;
const CONTAINER_PADDING = 16;
const GAP = 8;
const ITEM_WIDTH = (SCREEN_W - (CONTAINER_PADDING * 2) - (GAP * 3)) / 4;

export function QuickActions() {
  const { t } = useLang();

  const actions = [
    { emoji: "🤖", label: t("ask_ai"), route: "/ai" },
    { emoji: "💊", label: t("action_meds"), route: "/medicines" },
    { emoji: "👨‍⚕️", label: t("action_add_doctor"), route: "/doctors" },
    { emoji: "🆘", label: t("action_sos"), route: "/family/emergency" },
    { emoji: "🖤", label: t("action_vitals"), route: "/vitals" },
    { emoji: "⏱️", label: t("action_timeline"), route: "/timeline" },
    { emoji: "🗃️", label: t("action_vault"), route: "/vault" },
    { emoji: "👨‍👩‍👧‍👦", label: t("action_family"), route: "/family" },
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
              <Text style={styles.emojiText}>{a.emoji}</Text>
            </View>
            <Text style={styles.label} numberOfLines={2}>
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
    gap: 12,
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
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 76,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  iconWrap: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiText: {
    fontSize: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 14,
  },
});
