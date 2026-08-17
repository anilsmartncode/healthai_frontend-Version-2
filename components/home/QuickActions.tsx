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
    icon: "flask-outline",
    key: "interactions",
    route: "/interactions",
    bg: "#FEF3C7",
  },
  {
    icon: "alarm-outline",
    key: "medicine_reminder",
    route: "/medicines/reminders",
    bg: "#FFF1F2",
  },
];

export function QuickActions() {
  const { t } = useLang();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>{t("quick_actions")}</Text>

      <View style={styles.list}>
        {ACTIONS.map((a) => (
          <Pressable
            key={a.key}
            style={({ pressed }) => [styles.listItem, pressed && styles.pressed]}
            onPress={() => router.push(a.route as any)}
          >
            <View style={[styles.iconWrap, { backgroundColor: a.bg }]}>
              <Ionicons name={a.icon as any} size={28} color={Colors.primary} />
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
    gap: 16,
    paddingHorizontal: 4,
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  list: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
  },
  listItem: {
    alignItems: "center",
    width: 76,
    gap: 8,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
    lineHeight: 16,
  },
});
