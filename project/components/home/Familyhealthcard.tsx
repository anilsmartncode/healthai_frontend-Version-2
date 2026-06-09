import { Pressable, View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { Card } from "@/components/ui/Card";
import { useLang } from "@/context/Languagecontext";

export function FamilyHealthCard() {
  const { t } = useLang();
  return (
    <Pressable
      onPress={() => router.push("/family")}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={styles.card}>
        {/* Icon — fixed size, never shrinks */}
        <Ionicons
          name="people-outline"
          size={30}
          color={Colors.primary}
          style={styles.icon}
        />

        {/* Text block — grows to fill available width */}
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {t("family_health")}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {t("care_hub")}
          </Text>
        </View>

        {/* Chevron — fixed, always on the right */}
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 14,
  },
  icon: {
    flexShrink: 0, // icon never squishes
  },
  text: {
    flex: 1, // fills space between icon and chevron
    minWidth: 0, // allows numberOfLines to truncate properly
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  sub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
