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

  const place = getCachedPlace(id || "");

  if (!place) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
        </View>
        <View style={styles.errorCenter}>
          <Ionicons name="alert-circle-outline" size={48} color="#CBD5E1" />
          <Text style={styles.errorText}>Place details not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

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

  const isHospital = category === "hospital";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* ── Header ── */}
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isHospital ? t("hospitals") : t("pharmacies")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── Placeholder Banner ── */}
        <View
          style={[
            styles.banner,
            { backgroundColor: isHospital ? "#FEE2E2" : "#DCFCE7" },
          ]}
        >
          <Ionicons
            name={isHospital ? "business" : "flask"}
            size={80}
            color={isHospital ? "#FCA5A5" : "#86EFAC"}
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
              <Ionicons name="star" size={16} color="#F59E0B" />
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
                <Ionicons name="location" size={20} color={Colors.primary} />
              </View>
              <View style={styles.contactTextWrap}>
                <Text style={[styles.contactLabel, { textAlign }]}>{t("address")}</Text>
                <Text style={[styles.contactValue, { textAlign }]}>{place.address}</Text>
              </View>
            </View>

            <View style={styles.contactDivider} />

            <View style={[styles.contactRow, { flexDirection: rowDirection }]}>
              <View style={styles.iconCircle}>
                <Ionicons name="call" size={20} color={Colors.primary} />
              </View>
              <View style={styles.contactTextWrap}>
                <Text style={[styles.contactLabel, { textAlign }]}>{t("phone_label")}</Text>
                <Text style={[styles.contactValue, { textAlign }]}>{place.phone}</Text>
              </View>
            </View>

            <View style={styles.contactDivider} />

            <View style={[styles.contactRow, { flexDirection: rowDirection }]}>
              <View style={styles.iconCircle}>
                <Ionicons name="time" size={20} color={Colors.primary} />
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
          <Ionicons name="call" size={20} color={Colors.primary} />
          <Text style={styles.actionOutlineText}>{t("call_now")}</Text>
        </Pressable>

        <Pressable
          onPress={handleDirections}
          style={[styles.actionBtn, styles.actionBtnSolid]}
        >
          <Ionicons name="navigate" size={20} color="#FFFFFF" />
          <Text style={styles.actionSolidText}>{t("get_directions")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
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
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  banner: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    padding: 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  placeName: {
    flex: 1,
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    lineHeight: 32,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  bullet: {
    fontSize: 14,
    color: "#CBD5E1",
  },
  distText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 24,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
  },
  contactCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: Radius.lg,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  contactTextWrap: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
    fontWeight: "500",
  },
  contactValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  contactDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
    marginLeft: 60,
  },
  bottomActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    borderRadius: Radius.lg,
    gap: 8,
  },
  actionBtnOutline: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  actionOutlineText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  actionBtnSolid: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionSolidText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
