import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";

interface CategorySelectorProps {
  activeTab: "hospital" | "pharmacy" | "diagnostic";
  onTabChange: (tab: "hospital" | "pharmacy" | "diagnostic") => void;
}

export default function CategorySelector({ activeTab, onTabChange }: CategorySelectorProps) {
  const { t } = useLang();

  return (
    <View style={styles.categoriesOuter}>
      <View style={styles.categoriesContainer}>
        <Pressable
          onPress={() => onTabChange("hospital")}
          style={[styles.catTab, activeTab === "hospital" && styles.catTabActive]}
        >
          <Ionicons
            name="business"
            size={14}
            color={activeTab === "hospital" ? "#FFFFFF" : Colors.textMuted}
          />
          <Text style={[styles.catText, activeTab === "hospital" && styles.catTextActive]}>
            {t("hospitals")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onTabChange("pharmacy")}
          style={[styles.catTab, activeTab === "pharmacy" && styles.catTabActive]}
        >
          <Ionicons
            name="flask"
            size={14}
            color={activeTab === "pharmacy" ? "#FFFFFF" : Colors.textMuted}
          />
          <Text style={[styles.catText, activeTab === "pharmacy" && styles.catTextActive]}>
            {t("pharmacies")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onTabChange("diagnostic")}
          style={[styles.catTab, activeTab === "diagnostic" && styles.catTabActive]}
        >
          <Ionicons
            name="pulse"
            size={14}
            color={activeTab === "diagnostic" ? "#FFFFFF" : Colors.textMuted}
          />
          <Text style={[styles.catText, activeTab === "diagnostic" && styles.catTextActive]}>
            {t("diagnostics")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  categoriesOuter: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  categoriesContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
  },
  catTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.md,
    paddingHorizontal: 4,
    paddingVertical: 7,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  catTextActive: {
    color: "#FFFFFF",
  },
});

