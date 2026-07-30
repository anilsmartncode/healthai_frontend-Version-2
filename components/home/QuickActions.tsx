import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Radius } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";
import type { TranslationKeys } from "@/context/Translations";

const ACTIONS: {
  icon: string;
  key: keyof TranslationKeys;
  route: string;
  bg: string;
}[] = [
  {
    icon: "cloud-upload-outline",
    key: "upload_report",
    route: "/upload",
    bg: "#EFF6FF",
  },
  {
    icon: "flask-outline",
    key: "interactions",
    route: "/interactions",
    bg: "#FEF3C7",
  },
  { icon: "people-outline", key: "add_family", route: "/family", bg: "#F0FDF4" },
  {
    icon: "chatbubble-ellipses-outline",
    key: "ask_ai",
    route: "/(tabs)/ai",
    bg: "#FDF4FF",
  },
  {
    icon: "location-outline",
    key: "nav_nearby",
    route: "/(tabs)/nearby",
    bg: "#ECFDF5",
  },
  {
    icon: "medkit-outline",
    key: "nav_medicines",
    route: "/(tabs)/medicines",
    bg: "#FFF1F2",
  },
];

export function QuickActions() {
  const { t } = useLang();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>{t("quick_actions")}</Text>

      {/* 
        Two-column grid using flex row + wrap.
        Each card is ~48% wide so two fit per row with the gap accounted for.
        Using percentage width is responsive across all screen sizes.
      */}
      <View style={styles.grid}>
        {ACTIONS.map((a) => (
          <Pressable
            key={a.key}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() => router.push(a.route as any)}
          >
            <View style={[styles.iconWrap, { backgroundColor: a.bg }]}>
              <Ionicons name={a.icon as any} size={22} color={Colors.primary} />
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {t(a.key)}
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    // ~48% keeps two cards per row regardless of screen width
    // The 10px gap between them is handled by parent's gap
    width: "48%",
    flexGrow: 1, // allows slight stretch on wide screens
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.75,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
});
