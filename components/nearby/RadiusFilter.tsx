import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

interface RadiusFilterProps {
  radius: number;
  onRadiusChange: (r: number) => void;
}

export default function RadiusFilter({ radius, onRadiusChange }: RadiusFilterProps) {
  return (
    <View style={styles.radiusContainer}>
      <Text style={styles.radiusLabel}>Search Range:</Text>
      <View style={styles.radiusPills}>
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
    paddingVertical: 12,
  },
  radiusLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  radiusPills: {
    flexDirection: "row",
    gap: 6,
  },
  radiusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  radiusPillActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
  radiusPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  radiusPillTextActive: {
    color: "#4F46E5",
  },
});
