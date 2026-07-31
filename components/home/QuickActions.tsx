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
              <Ionicons name={a.icon as any} size={22} color={Colors.primary} />
            </View>
            <Text style={styles.label} numberOfLines={1}>
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
  list: {
    gap: 10,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.75,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
});
