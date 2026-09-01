import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/constants/Colors";
import { getCachedPlace } from "@/services/PlacesStore";
import { useLang } from "@/context/Languagecontext";

export default function PlaceDetailsScreen() {
  const { id, category } = useLocalSearchParams<{ id: string; category: string }>();
  const router = useRouter();
  const { t, rowDirection, textAlign, isRTL } = useLang();

  const cachedPlace = getCachedPlace(id || "");

  const isHospital = category === "hospital";
  const isDiagnostic = category === "diagnostic";

  const place = cachedPlace || {
    id: id || "mock_1",
    name: isDiagnostic
      ? "Apollo Diagnostic Centre"
      : isHospital
        ? "City Care Hospital"
        : "MedPlus Pharmacy",
    address: "Main Road, Healthcare District",
    distance: 1.2,
    lat: 12.9716,
    lng: 77.5946,
    rating: "4.5",
    reviews: 142,
    openNow: true,
    phone: "+91 80000 55555",
  };

  const handleDirections = () => {
    const query = encodeURIComponent(`${place.name} ${place.address}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url).catch((err) => {
      console.log("[Details] Failed to open maps link:", err);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    });
  };

  const handleCall = () => {
    Linking.openURL(`tel:${place.phone}`).catch((err) =>
      console.log("[Details] Call failed:", err)
    );
  };

  const headerTitleText = isHospital
    ? t("hospitals")
    : isDiagnostic
      ? (t("diagnostics") || "Diagnostics")
      : t("pharmacies");

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* ── Header ── */}
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{headerTitleText}</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Placeholder Banner ── */}
        <View
          style={[
            styles.banner,
            {
              backgroundColor: isHospital
                ? "#FEE2E2"
                : isDiagnostic
                  ? "#EEF2FF"
                  : "#DCFCE7",
            },
          ]}
        >
          <Ionicons
            name={isHospital ? "business" : isDiagnostic ? "pulse" : "flask"}
            size={52}
            color={
              isHospital
                ? "#FCA5A5"
                : isDiagnostic
                  ? "#818CF8"
                  : "#86EFAC"
            }
          />
        </View>

        {/* ── Main Info ── */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.placeName}>{place.name}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: place.openNow ? "#DCFCE7" : "#F3F4F6" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: place.openNow ? "#16A34A" : "#6B7280" },
                ]}
              >
                {place.openNow ? t("open_24_hours") : t("closed_currently")}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {place.rating} ({place.reviews} reviews)
              </Text>
            </View>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.distText}>
              {place.distance} {t("distance_km")}
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { textAlign }]}>{t("about")}</Text>
          <Text style={[styles.descriptionText, { textAlign }]}>
            {place.name} is a premier {isHospital ? "medical facility" : "pharmacy"}{" "}
            providing comprehensive healthcare services to the local community.
          </Text>

          {/* ── Contact Details ── */}
          <View style={styles.contactCard}>
            <View style={[styles.contactRow, { flexDirection: rowDirection }]}>
              <View style={styles.iconCircle}>
                <Ionicons name="location" size={16} color={Colors.primary} />
              </View>
              <View style={styles.contactTextWrap}>
                <Text style={[styles.contactLabel, { textAlign }]}>{t("address")}</Text>
                <Text style={[styles.contactValue, { textAlign }]}>{place.address}</Text>
              </View>
            </View>

            <View style={styles.contactDivider} />

            <View style={[styles.contactRow, { flexDirection: rowDirection }]}>
              <View style={styles.iconCircle}>
                <Ionicons name="call" size={16} color={Colors.primary} />
              </View>
              <View style={styles.contactTextWrap}>
                <Text style={[styles.contactLabel, { textAlign }]}>{t("phone_label")}</Text>
                <Text style={[styles.contactValue, { textAlign }]}>{place.phone}</Text>
              </View>
            </View>

            <View style={styles.contactDivider} />

            <View style={[styles.contactRow, { flexDirection: rowDirection }]}>
              <View style={styles.iconCircle}>
                <Ionicons name="time" size={16} color={Colors.primary} />
              </View>
              <View style={styles.contactTextWrap}>
                <Text style={[styles.contactLabel, { textAlign }]}>{t("hours_label")}</Text>
                <Text style={[styles.contactValue, { textAlign }]}>
                  {place.openNow ? t("open_24_hours") : t("closed_currently")}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom Action Buttons ── */}
      <View style={[styles.bottomActions, { flexDirection: rowDirection }]}>
        <Pressable
          onPress={handleCall}
          style={[styles.actionBtn, styles.actionBtnOutline]}
        >
          <Ionicons name="call" size={16} color={Colors.primary} />
          <Text style={styles.actionOutlineText}>Call Now</Text>
        </Pressable>

        <Pressable
          onPress={handleDirections}
          style={[styles.actionBtn, styles.actionBtnSolid]}
        >
          <Ionicons name="navigate" size={16} color="#FFFFFF" />
          <Text style={styles.actionSolidText}>Directions</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  errorCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  banner: {
    height: 130,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  placeName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 24,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#475569",
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 18,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 19,
  },
  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  contactTextWrap: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 1,
    fontWeight: "500",
  },
  contactValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  contactDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
    marginLeft: 48,
  },
  bottomActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42,
    borderRadius: Radius.md,
    gap: 6,
  },
  actionBtnOutline: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionOutlineText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  actionBtnSolid: {
    backgroundColor: Colors.primary,
  },
  actionSolidText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
