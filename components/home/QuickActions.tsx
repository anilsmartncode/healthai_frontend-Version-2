import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";

const SCREEN_W = Dimensions.get("window").width;
const ITEM_WIDTH = (SCREEN_W - 56) / 3;

const ACTIONS: {
  emoji: string;
  label: string;
  route: string;
}[] = [
  {
    emoji: "👨‍⚕️",
    label: "Add Doctor",
    route: "/doctors",
  },
  {
    emoji: "🔄",
    label: "Interactions",
    route: "/medicines/check-interactions",
  },
  {
    emoji: "⏰",
    label: "Reminders",
    route: "/medicines/reminders",
  },
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
    emoji: "🆘",
    label: "SOS",
    route: "/family/emergency",
  },
];

export function QuickActions() {
  const [showArrow, setShowArrow] = useState(true);

  const handleScroll = (e: any) => {
    if (e.nativeEvent.contentOffset.x > 15) {
      setShowArrow(false);
    } else {
      setShowArrow(true);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>Quick actions</Text>

      <View style={styles.row}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          snapToInterval={ITEM_WIDTH + 12}
          decelerationRate="fast"
        >
          {ACTIONS.map((a, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.listItem, pressed && styles.pressed, { width: ITEM_WIDTH }]}
              onPress={() => router.push(a.route as any)}
            >
              <View style={styles.iconWrap}>
                <Text style={styles.emojiText}>{a.emoji}</Text>
              </View>
              <Text style={styles.label} numberOfLines={2}>
                {a.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {showArrow && (
          <View style={styles.arrowOverlay} pointerEvents="none">
            <View style={styles.arrowCircle}>
              <Ionicons name="chevron-forward" size={16} color="#475569" />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
    marginHorizontal: -16,
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    paddingHorizontal: 16,
  },
  row: {
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  listItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    minHeight: 105,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  emojiText: {
    fontSize: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 16,
  },
  arrowOverlay: {
    position: 'absolute',
    right: 6,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }
});
