import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Colors, Radius } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";
import { Card } from "@/components/ui/Card";
import { fetchGeoapifyPlaces, GeoapifyPlace } from "@/services/geoapify";

interface PlaceItem {
  id: string;
  name: string;
  address: string;
  distance: number;
  lat: number;
  lng: number;
  rating: string;
  reviews: number;
  openNow: boolean;
  phone: string;
}

export default function NearbyScreen() {
  const { t } = useLang();

  // State
  const [activeTab, setActiveTab] = useState<"hospital" | "pharmacy" | "doctors">("hospital");
  const [radius, setRadius] = useState<number>(5000); // meters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [gpsError, setGpsError] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cache for fetched categories
  const [placesCache, setPlacesCache] = useState<Record<string, PlaceItem[]>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fallback center if GPS is unavailable (e.g. Bangalore center)
  const FALLBACK_LAT = 12.9716;
  const FALLBACK_LNG = 77.5946;

  // Haversine formula to calculate distance in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  // Fetch places from Geoapify
  const loadPlaces = async (
    lat: number,
    lng: number,
    category: "hospital" | "pharmacy" | "doctors"
  ) => {
    if (placesCache[category]) {
      updateDisplayedPlaces(placesCache[category], radius);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Always fetch max radius (10km) to allow local filtering
      const rawPlaces = await fetchGeoapifyPlaces(lat, lng, 10000, category, abortControllerRef.current.signal);
      
      const mapped: PlaceItem[] = rawPlaces.map((feature: GeoapifyPlace, index: number) => {
        const props = feature.properties;
        const plat = props.lat;
        const plng = props.lon;
        const dist = calculateDistance(lat, lng, plat, plng);
        
        let address = "Address near coordinates";
        if (props.street) {
          address = props.housenumber ? `${props.housenumber} ${props.street}` : props.street;
        } else if (props.address_line2) {
          address = props.address_line2;
        }

        return {
          id: props.place_id || `${category}_${index}`,
          name: props.name || (category === "hospital" ? "Local Hospital" : category === "pharmacy" ? "Local Pharmacy" : "Local Clinic"),
          address: address,
          distance: dist,
          lat: plat,
          lng: plng,
          rating: (4.2 + Math.random() * 0.7).toFixed(1),
          reviews: Math.floor(10 + Math.random() * 190),
          openNow: Math.random() > 0.3,
          phone: props.contact?.phone || props.datasource?.raw?.phone || "+91 99000 12345",
        };
      });

      mapped.sort((a, b) => a.distance - b.distance);
      
      setPlacesCache(prev => ({ ...prev, [category]: mapped }));
      updateDisplayedPlaces(mapped, radius);
      setErrorMsg(null);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("[Nearby] Fetch aborted");
        return;
      }
      console.log("[Nearby] Geoapify fetch error:", err.message);
      setPlaces([]);
      setErrorMsg("Failed to connect to the medical directory database. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const updateDisplayedPlaces = (allPlaces: PlaceItem[], currentRadius: number) => {
    // Local filter by radius
    const radiusFiltered = allPlaces.filter(p => p.distance <= currentRadius / 1000);
    setPlaces(radiusFiltered);
  };

  // Get User Location
  const requestLocation = async () => {
    setGpsLoading(true);
    setGpsError(false);
    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGpsError(true);
        setGpsLoading(false);
        loadPlaces(FALLBACK_LAT, FALLBACK_LNG, activeTab);
        return;
      }

      let loc = await Location.getLastKnownPositionAsync({});
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      setLocation(loc);
      setGpsLoading(false);
      loadPlaces(loc.coords.latitude, loc.coords.longitude, activeTab);
    } catch (err) {
      console.log("[Nearby] Location fetch failed:", err);
      setGpsError(true);
      setGpsLoading(false);
      loadPlaces(FALLBACK_LAT, FALLBACK_LNG, activeTab);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Reload places when tab or radius changes
  const handleConfigChange = (newTab: "hospital" | "pharmacy" | "doctors", newRadius: number) => {
    setActiveTab(newTab);
    setRadius(newRadius);
    
    const lat = location ? location.coords.latitude : FALLBACK_LAT;
    const lng = location ? location.coords.longitude : FALLBACK_LNG;
    
    if (newTab !== activeTab) {
      loadPlaces(lat, lng, newTab);
    } else {
      if (placesCache[newTab]) {
         updateDisplayedPlaces(placesCache[newTab], newRadius);
      }
    }
  };

  // Trigger search on API
  const triggerApiSearch = () => {
    // Local filtering is already handled reactively by filteredPlaces below.
  };

  // Clear search query
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Native navigation linking
  const handleDirections = (item: PlaceItem) => {
    const query = encodeURIComponent(`${item.name} ${item.address}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url).catch((err) => {
      console.log("[Nearby] Failed to open maps link:", err);
      // Fallback to direct web maps link
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch((err) =>
      console.log("[Nearby] Call failed:", err)
    );
  };

  // Filter places based on search query input with trimming to prevent space issues
  const filteredPlaces = places.filter((p) => {
    const cleanQuery = searchQuery.trim().toLowerCase();
    return (
      p.name.toLowerCase().includes(cleanQuery) ||
      p.address.toLowerCase().includes(cleanQuery)
    );
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("nav_nearby")}</Text>
          <Text style={styles.subtitle}>Find medical services around you</Text>
        </View>
        {(loading || gpsLoading) && <ActivityIndicator size="small" color={Colors.primary} />}
      </View>

      {/* ── Search Input ── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Pressable onPress={triggerApiSearch}>
            <Ionicons name="search" size={18} color={Colors.primary} />
          </Pressable>
          <TextInput
            placeholder="Search by name or street..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={triggerApiSearch}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={clearSearch}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── GPS Permission Warning Banner ── */}
      {gpsError && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={16} color="#B45309" />
          <Text style={styles.warningText}>
            GPS permission denied. Showing fallback results for Bangalore center.
          </Text>
        </View>
      )}

      {/* ── Tab categories selector ── */}
      <View style={styles.categoriesOuter}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {/* Hospitals Tab */}
          <Pressable
            onPress={() => handleConfigChange("hospital", radius)}
            style={[styles.catTab, activeTab === "hospital" && styles.catTabActive]}
          >
            <Ionicons
              name="business"
              size={16}
              color={activeTab === "hospital" ? "#FFFFFF" : "#64748B"}
            />
            <Text style={[styles.catText, activeTab === "hospital" && styles.catTextActive]}>
              {t("hospitals")}
            </Text>
          </Pressable>

          {/* Pharmacies Tab */}
          <Pressable
            onPress={() => handleConfigChange("pharmacy", radius)}
            style={[styles.catTab, activeTab === "pharmacy" && styles.catTabActive]}
          >
            <Ionicons
              name="flask"
              size={16}
              color={activeTab === "pharmacy" ? "#FFFFFF" : "#64748B"}
            />
            <Text style={[styles.catText, activeTab === "pharmacy" && styles.catTextActive]}>
              {t("pharmacies")}
            </Text>
          </Pressable>

          {/* Doctors Tab */}
          <Pressable
            onPress={() => handleConfigChange("doctors", radius)}
            style={[styles.catTab, activeTab === "doctors" && styles.catTabActive]}
          >
            <Ionicons
              name="people"
              size={16}
              color={activeTab === "doctors" ? "#FFFFFF" : "#64748B"}
            />
            <Text style={[styles.catText, activeTab === "doctors" && styles.catTextActive]}>
              {t("doctors")}
            </Text>
            <View style={styles.soonBadge}>
              <Text style={styles.soonText}>SOON</Text>
            </View>
          </Pressable>
        </ScrollView>
      </View>

      {/* ── Radius selector ── */}
      <View style={styles.radiusContainer}>
        <Text style={styles.radiusLabel}>Search Range:</Text>
        <View style={styles.radiusPills}>
          {[1000, 5000, 10000].map((r) => (
            <Pressable
              key={r}
              onPress={() => handleConfigChange(activeTab, r)}
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

      {/* ── Places List ── */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {loading ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Searching medical nodes...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.emptyCenter}>
            <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>{errorMsg}</Text>
            <Pressable onPress={requestLocation} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry Search</Text>
            </Pressable>
          </View>
        ) : places.length > 0 && filteredPlaces.length === 0 ? (
          // Separated Search empty state from global location failure empty state
          <View style={styles.emptyCenter}>
            <Ionicons name="search-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              No matching results found for "{searchQuery}".
            </Text>
            <Pressable onPress={() => setSearchQuery("")} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Clear Search</Text>
            </Pressable>
          </View>
        ) : filteredPlaces.length > 0 ? (
          filteredPlaces.map((item) => (
            <Card key={item.id} style={styles.placeCard}>
              <View style={styles.placeTop}>
                {/* Category Icon Badge */}
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
                    name={
                      activeTab === "hospital"
                        ? "business"
                        : activeTab === "pharmacy"
                          ? "flask"
                          : "people"
                    }
                    size={20}
                    color={
                      activeTab === "hospital"
                        ? "#EF4444"
                        : activeTab === "pharmacy"
                          ? "#22C55E"
                          : "#6366F1"
                    }
                  />
                </View>

                {/* Place details */}
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.placeAddress} numberOfLines={1}>
                    {item.address}
                  </Text>

                  {/* Rating + Distance Row */}
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

                {/* Open Status Badge */}
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
              </View>

              {/* Action Buttons */}
              <View style={styles.placeActions}>
                <Pressable
                  onPress={() => handleCall(item.phone)}
                  style={[styles.actionBtn, styles.actionBtnCall]}
                >
                  <Ionicons name="call-outline" size={16} color="#64748B" />
                  <Text style={styles.actionCallText}>Call</Text>
                </Pressable>

                <Pressable
                  onPress={() => handleDirections(item)}
                  style={[styles.actionBtn, styles.actionBtnDirections]}
                >
                  <Ionicons name="navigate-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.actionDirectionsText}>{t("get_directions")}</Text>
                </Pressable>
              </View>
            </Card>
          ))
        ) : (
          <View style={styles.emptyCenter}>
            <Ionicons name="location-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              No hospitals or pharmacies found within {radius / 1000} km of your location.
            </Text>
            <Pressable onPress={requestLocation} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Retry Location</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
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
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  warningText: {
    fontSize: 11,
    color: "#B45309",
    fontWeight: "500",
    flex: 1,
  },
  categoriesOuter: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
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
    borderColor: "#E2E8F0",
  },
  catTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  catTextActive: {
    color: "#FFFFFF",
  },
  soonBadge: {
    backgroundColor: "#ECEFDF5",
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginLeft: 2,
    borderWidth: 0.5,
    borderColor: "#CBD5E1",
  },
  soonText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#475569",
  },
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  placeCard: {
    padding: 14,
    gap: 12,
  },
  placeTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  placeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  placeInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  placeName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  placeAddress: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
  },
  bullet: {
    fontSize: 11,
    color: "#CBD5E1",
  },
  distText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.primary,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  placeActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    borderRadius: Radius.md,
    gap: 6,
    borderWidth: 1,
  },
  actionBtnCall: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  actionCallText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  actionBtnDirections: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionDirectionsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
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
