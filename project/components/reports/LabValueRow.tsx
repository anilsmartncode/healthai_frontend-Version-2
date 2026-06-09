import { View, Text, StyleSheet } from "react-native";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Colors } from "@/constants/Colors";
import type { LabValue } from "@/types";

interface Props {
  value: LabValue;
  variant?: "compact" | "full";
}

export function LabValueRow({ value: v, variant = "compact" }: Props) {
  if (variant === "full") {
    return (
      <Card style={styles.tableRow}>
        <Text style={styles.fullName} numberOfLines={1}>
          {v.name}
        </Text>
        <Text style={styles.fullValue}>{v.value}</Text>
        <Text style={styles.fullRange} numberOfLines={1}>
          {v.range}
        </Text>
        <Badge label={v.status} status={v.status} />
      </Card>
    );
  }

  return (
    <Card style={styles.compactRow}>
      {/* Col 1 — name + range */}
      <View style={styles.nameCol}>
        <Text style={styles.name} numberOfLines={1}>
          {v.name}
        </Text>
        <Text style={styles.meta}>Range: {v.range}</Text>
      </View>

      {/* Col 2 — value */}
      <Text style={styles.val}>{v.value}</Text>

      {/* Col 3 — badge (same width as badge itself: 72) */}
      <Badge label={v.status} status={v.status} />
    </Card>
  );
}

const styles = StyleSheet.create({
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  nameCol: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  meta: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  val: {
    width: 90, // ← was 36
    marginRight: 8, // ← was 20
    textAlign: "left", // ← was 'center'
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },

  // ── Full / table ──────────────────────────────────────────────────────────
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  fullName: {
    flex: 1.5,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  fullValue: {
    width: 90, // ← was 36
    marginRight: 8, // ← was 20
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "left", // ← was 'center'
  },
  fullRange: {
    flex: 1.4,
    fontSize: 12,
    color: Colors.textMuted,
  },
});
