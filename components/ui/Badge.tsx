import { Text, View, StyleSheet } from "react-native";
import { Colors, Radius } from "@/constants/Colors";
import type { ReportStatus } from "@/types";

const colorMap: Record<ReportStatus, string> = {
  good: Colors.success,
  normal: Colors.success,
  attention: Colors.warning,
  /* borderline: Colors.warning, */ // orange — near low/high
  low: Colors.danger, // red
  high: Colors.danger, // red
};

export function Badge({
  label,
  status,
}: {
  label: string;
  status: ReportStatus;
}) {
  const c = colorMap[status] ?? Colors.info;
  return (
    <View style={[styles.badge, { backgroundColor: c + "22", borderColor: c }]}>
      <Text style={[styles.text, { color: c }]}>
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 72,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: "center",
  },
  text: { fontSize: 12, fontWeight: "600" },
});
