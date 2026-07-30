import React from "react";
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";

interface EmptyStateProps {
  type: "loading" | "error" | "search" | "empty";
  message?: string | null;
  radius?: number;
  searchQuery?: string;
  onRetry?: () => void;
  onClearSearch?: () => void;
}

export default function EmptyState({
  type,
  message,
  radius = 5000,
  searchQuery = "",
  onRetry,
  onClearSearch,
}: EmptyStateProps) {
  if (type === "loading") {
    return (
      <View style={styles.loaderCenter}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Searching medical nodes...</Text>
      </View>
    );
  }

  if (type === "error") {
    return (
      <View style={styles.emptyCenter}>
        <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
        <Text style={styles.emptyText}>{message}</Text>
        {onRetry && (
          <Pressable onPress={onRetry} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry Search</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (type === "search") {
    return (
      <View style={styles.emptyCenter}>
        <Ionicons name="search-outline" size={48} color="#CBD5E1" />
        <Text style={styles.emptyText}>
          No matching results found for &quot;{searchQuery}&quot;.
        </Text>
        {onClearSearch && (
          <Pressable onPress={onClearSearch} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Clear Search</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.emptyCenter}>
      <Ionicons name="location-outline" size={48} color="#CBD5E1" />
      <Text style={styles.emptyText}>
        No hospitals or pharmacies found within {radius / 1000} km of your location.
      </Text>
      {onRetry && (
        <Pressable onPress={onRetry} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Retry Location</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loaderCenter: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loaderText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  emptyCenter: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 30,
    fontWeight: "500",
  },
  retryBtn: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 6,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
});
