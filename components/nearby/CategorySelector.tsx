import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";

interface CategorySelectorProps {
  activeTab: "hospital" | "pharmacy";
  onTabChange: (tab: "hospital" | "pharmacy") => void;
}

export default function CategorySelector({ activeTab, onTabChange }: CategorySelectorProps) {
  const { t } = useLang();

  return (
    <View style={styles.categoriesOuter}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        <Pressable
          onPress={() => onTabChange("hospital")}
          style={[styles.catTab, activeTab === "hospital" && styles.catTabActive]}
        >
          <Ionicons
            name="business"
            size={16}
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
            size={16}
            color={activeTab === "pharmacy" ? "#FFFFFF" : Colors.textMuted}
          />
          <Text style={[styles.catText, activeTab === "pharmacy" && styles.catTextActive]}>
            {t("pharmacies")}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  categoriesOuter: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catTab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  catTextActive: {
    color: "#FFFFFF",
  },
});

