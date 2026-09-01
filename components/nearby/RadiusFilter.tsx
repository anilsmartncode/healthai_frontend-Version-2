import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";

interface RadiusFilterProps {
  radius: number;
  onRadiusChange: (r: number) => void;
}

export default function RadiusFilter({ radius, onRadiusChange }: RadiusFilterProps) {
  const { t, rowDirection } = useLang();

  return (
    <View style={[styles.radiusContainer, { flexDirection: rowDirection }]}>
      <Text style={styles.radiusLabel}>{t("search_range")}</Text>
      <View style={[styles.radiusPills, { flexDirection: rowDirection }]}>
        {[1000, 5000, 10000].map((r) => (
          <Pressable
            key={r}
            onPress={() => onRadiusChange(r)}
            style={[styles.radiusPill, radius === r && styles.radiusPillActive]}
          >
            <Text
              style={[
                styles.radiusPillText,
                radius === r && styles.radiusPillTextActive,
              ]}
            >
              {r / 1000} km
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  radiusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  radiusLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  radiusPills: {
    flexDirection: "row",
    gap: 6,
  },
  radiusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radiusPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radiusPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  radiusPillTextActive: {
    color: "#FFFFFF",
  },
});
