import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Colors } from "@/constants/Colors";

const TIPS = [
  "Drink at least 2–3 liters of water daily.",
  "Walk 30 minutes every morning.",
  "Sleep 7–8 hours for optimal recovery.",
  "Eat a balanced diet rich in vegetables.",
];

export function HealthTipCard() {
  const tip = TIPS[Math.floor(Date.now() / 86400000) % TIPS.length];

  return (
    <Card style={styles.card}>
      {/* Row: icon + title side by side */}
      <View style={styles.row}>
        <Ionicons
          name="bulb-outline"
          size={20}
          color="#B45309"
          style={styles.icon}
        />
        <Text style={styles.title} numberOfLines={1}>
          Today's Health Tip
        </Text>
      </View>

      {/* Tip body wraps naturally — no fixed height */}
      <Text style={styles.body}>{tip}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
    gap: 6,
    // No fixed height — card sizes to content
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  icon: {
    flexShrink: 0,
  },
  title: {
    flex: 1, // fills row, truncates if needed
    fontWeight: "700",
    color: "#92400E",
  },
  body: {
    color: "#92400E",
    lineHeight: 20,
    flexWrap: "wrap", // text wraps naturally across screen sizes
  },
});
