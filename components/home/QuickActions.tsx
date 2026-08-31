import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import React from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

const SCREEN_W = Dimensions.get("window").width;
const CONTAINER_PADDING = 16;
const GAP = 6;
const ITEM_WIDTH = (SCREEN_W - (CONTAINER_PADDING * 2) - (GAP * 4)) / 5;

const ACTIONS: {
  emoji?: string;
  ionicon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  route: string;
}[] = [
  {
    emoji: "🤖",
    label: "Ask AI",
    route: "/ai",
  },
  {
    emoji: "💊",
    label: "Meds",
    route: "/medicines",
  },
  {
    emoji: "📅",
    label: "Book visit",
    route: "/appointments",
  },
  {
    emoji: "🆘",
    label: "SOS",
    route: "/family/emergency",
  },
  {
    emoji: "🖤",
    label: "Vitals",
    route: "/vitals",
  },
  {
    emoji: "⏱️",
    label: "Timeline",
    route: "/timeline",
  },
  {
    emoji: "💉",
    label: "Vaccines",
    route: "/vaccines",
  },
  {
    ionicon: "sync-circle-outline",
    iconColor: "#0D7B5F",
    label: "Interactions",
    route: "/medicines/check-interactions",
  },
  {
    emoji: "🗃️",
    label: "Vault",
    route: "/vault",
  },
  {
    ionicon: "people",
    iconColor: "#FF9500",
    label: "Family",
    route: "/family",
  },
];

export function QuickActions() {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>Quick actions</Text>

      <View style={styles.gridContainer}>
        {ACTIONS.map((a, i) => (
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
                <Ionicons name={a.ionicon} size={22} color={a.iconColor || Colors.primary} />
              ) : (
                <Text style={styles.emojiText}>{a.emoji}</Text>
              )}
            </View>
            <Text
              style={styles.label}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 74,
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
    fontSize: 9,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 13,
    letterSpacing: -0.2,
  },
});
