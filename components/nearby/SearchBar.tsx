import React from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  onClear: () => void;
}

export default function SearchBar({ searchQuery, setSearchQuery, onClear }: SearchBarProps) {
  const { t, textAlign, rowDirection } = useLang();

  return (
    <View style={styles.searchContainer}>
      <View style={[styles.searchBar, { flexDirection: rowDirection }]}>
        <Ionicons name="search" size={18} color={Colors.primary} />
        <TextInput
          placeholder={t("search_nearby_placeholder")}
          placeholderTextColor="#94A3B8"
          style={[styles.searchInput, { textAlign }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={onClear}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 8,
  },
});
