import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";
import { PlaceItem } from "./types";
import { useLang } from "@/context/Languagecontext";
import { useRouter } from "expo-router";

interface MapBottomSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet>;
  selectedPlace: PlaceItem | null;
  activeTab: "hospital" | "pharmacy" | "diagnostic";
  onClose: () => void;
  onCall: (phone: string) => void;
  onDirections: (place: PlaceItem) => void;
}

export default function MapBottomSheet({
  bottomSheetRef,
  selectedPlace,
  activeTab,
  onClose,
  onCall,
  onDirections,
}: MapBottomSheetProps) {
  const { t, rowDirection, textAlign } = useLang();
  const router = useRouter();

  const snapPoints = useMemo(() => ["35%", "50%"], []);

  const handleViewDetails = () => {
    if (!selectedPlace) return;
    router.push({
      pathname: "/place/[id]",
      params: { id: selectedPlace.id, category: activeTab },
    });
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={onClose}
      backgroundStyle={styles.bottomSheetBg}
    >
      <BottomSheetView style={styles.contentContainer}>
        {selectedPlace ? (
          <View style={styles.cardContent}>
            <View style={[styles.placeTop, { flexDirection: rowDirection }]}>
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
                  size={24}
                  color={activeTab === "hospital" ? "#EF4444" : "#22C55E"}
                />
              </View>

              <View style={styles.placeInfo}>
                <Text style={[styles.placeName, { textAlign }]} numberOfLines={1}>
                  {selectedPlace.name}
                </Text>
                <Text style={[styles.placeAddress, { textAlign }]} numberOfLines={2}>
                  {selectedPlace.address}
                </Text>

                <View style={[styles.metaRow, { flexDirection: rowDirection }]}>
                  <View style={[styles.ratingRow, { flexDirection: rowDirection }]}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.ratingText}>
                      {selectedPlace.rating} ({selectedPlace.reviews})
                    </Text>
                  </View>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.distText}>
                    {selectedPlace.distance} {t("distance_km")}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.placeActions, { flexDirection: rowDirection }]}>
              <Pressable
                onPress={() => onCall(selectedPlace.phone)}
                style={[styles.actionBtn, styles.actionBtnOutline, { flex: 0.8 }]}
              >
                <Ionicons name="call" size={18} color={Colors.primary} />
                <Text style={styles.actionOutlineText}>{t("call")}</Text>
              </Pressable>

              <Pressable
                onPress={handleViewDetails}
                style={[styles.actionBtn, styles.actionBtnOutline]}
              >
                <Text style={styles.actionOutlineText}>{t("details")}</Text>
              </Pressable>

              <Pressable
                onPress={() => onDirections(selectedPlace)}
                style={[styles.actionBtn, styles.actionBtnSolid]}
              >
                <Ionicons name="navigate" size={18} color="#FFFFFF" />
                <Text style={styles.actionSolidText}>{t("get_directions")}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { textAlign }]}>{t("select_location_map")}</Text>
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetBg: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  cardContent: {
    gap: 20,
  },
  placeTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  placeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  placeInfo: {
    flex: 1,
    gap: 4,
  },
  placeName: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
  },
  placeAddress: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
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
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  bullet: {
    fontSize: 13,
    color: "#CBD5E1",
  },
  distText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
  placeActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: Radius.md,
    gap: 6,
  },
  actionBtnOutline: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
  },
});
