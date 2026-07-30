import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";
import { Card } from "@/components/ui/Card";
import { PlaceItem } from "./types";
import { useLang } from "@/context/Languagecontext";
import { useRouter } from "expo-router";

interface PlaceCardProps {
  item: PlaceItem;
  activeTab: "hospital" | "pharmacy";
  onCall: (phone: string) => void;
  onDirections: (item: PlaceItem) => void;
}

export default function PlaceCard({ item, activeTab, onCall, onDirections }: PlaceCardProps) {
  const { t } = useLang();
  const router = useRouter();

  const handleViewDetails = () => {
    // Navigate with animation to the details screen
    router.push({
      pathname: "/place/[id]",
      params: { id: item.id, category: activeTab },
    });
  };

  return (
    <Card style={styles.placeCard}>
      <View style={styles.placeTop}>
        <View
          style={[
            styles.placeIconWrap,
            {
              backgroundColor:
                activeTab === "hospital"
                  ? "#FEE2E2"
                  : activeTab === "pharmacy"
                    ? "#DCFCE7"
                    : "#EEF2FF",
            },
          ]}
        >
          <Ionicons
            name={activeTab === "hospital" ? "business" : "flask"}
            size={22}
            color={activeTab === "hospital" ? "#EF4444" : "#22C55E"}
          />
        </View>

        <View style={styles.placeInfo}>
          <Text style={styles.placeName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.placeAddress} numberOfLines={2}>
            {item.address}
          </Text>
          
          <View style={styles.metaRow}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {item.rating} ({item.reviews})
              </Text>
            </View>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.distText}>
              {item.distance} {t("distance_km")}
            </Text>
          </View>
        </View>

        <View style={styles.topRightActions}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.openNow ? "#DCFCE7" : "#F3F4F6" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: item.openNow ? "#16A34A" : "#6B7280" },
              ]}
            >
              {item.openNow ? "Open" : "Closed"}
            </Text>
          </View>
          <Pressable onPress={() => onCall(item.phone)} style={styles.iconBtn}>
            <Ionicons name="call" size={18} color={Colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.placeActions}>
        <Pressable
          onPress={handleViewDetails}
          style={[styles.actionBtn, styles.actionBtnOutline]}
        >
          <Text style={styles.actionOutlineText}>View Details</Text>
        </Pressable>

        <Pressable
          onPress={() => onDirections(item)}
          style={[styles.actionBtn, styles.actionBtnSolid]}
        >
          <Ionicons name="navigate" size={16} color="#FFFFFF" />
          <Text style={styles.actionSolidText}>{t("get_directions")}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  placeCard: {
    padding: 16,
    gap: 16,
    borderRadius: Radius.lg,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  placeTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  placeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  placeInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  placeName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  placeAddress: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  bullet: {
    fontSize: 12,
    color: "#CBD5E1",
  },
  distText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  topRightActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  placeActions: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: Radius.md,
    gap: 8,
  },
  actionBtnOutline: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionOutlineText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  actionBtnSolid: {
    backgroundColor: Colors.primary,
  },
  actionSolidText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
