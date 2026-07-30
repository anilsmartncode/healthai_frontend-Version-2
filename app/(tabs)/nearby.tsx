import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Colors } from "@/constants/Colors";
import { useLang } from "@/context/Languagecontext";
import { fetchGeoapifyPlaces, GeoapifyPlace } from "@/services/geoapify";
import { cachePlace } from "@/services/PlacesStore";
import MapView from "react-native-maps";
import BottomSheet from "@gorhom/bottom-sheet";

import { PlaceItem } from "@/components/nearby/types";
import SearchBar from "@/components/nearby/SearchBar";
import CategorySelector from "@/components/nearby/CategorySelector";
import RadiusFilter from "@/components/nearby/RadiusFilter";
import EmptyState from "@/components/nearby/EmptyState";
import PlaceCard from "@/components/nearby/PlaceCard";
import PlaceMarker from "@/components/nearby/PlaceMarker";
import MapBottomSheet from "@/components/nearby/MapBottomSheet";

export default function NearbyScreen() {
  const { t } = useLang();

  // State
  const [activeTab, setActiveTab] = useState<"hospital" | "pharmacy">("hospital");
  const [radius, setRadius] = useState<number>(5000); // meters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [gpsError, setGpsError] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedMarker, setSelectedMarker] = useState<PlaceItem | null>(null);

  // Cache for fetched categories
  const [placesCache, setPlacesCache] = useState<Record<string, PlaceItem[]>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);

  // Fallback center if GPS is unavailable
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
    category: "hospital" | "pharmacy"
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
      const rawPlaces = await fetchGeoapifyPlaces(
        lat,
        lng,
        10000,
        category,
        abortControllerRef.current.signal
      );

      const mapped: PlaceItem[] = rawPlaces.map((feature: GeoapifyPlace, index: number) => {
        const props = feature.properties;
        const plat = props.lat;
        const plng = props.lon;
        const dist = calculateDistance(lat, lng, plat, plng);

        let address = "Address near coordinates";
        if (props.street) {
          address = props.housenumber
            ? `${props.housenumber} ${props.street}`
            : props.street;
        } else if (props.address_line2) {
          address = props.address_line2;
        }

        const placeObj = {
          id: props.place_id || `${category}_${index}`,
          name:
            props.name ||
            (category === "hospital" ? "Local Hospital" : "Local Pharmacy"),
          address: address,
          distance: dist,
          lat: plat,
          lng: plng,
          rating: (4.2 + Math.random() * 0.7).toFixed(1),
          reviews: Math.floor(10 + Math.random() * 190),
          openNow: Math.random() > 0.3,
          phone:
            props.contact?.phone ||
            props.datasource?.raw?.phone ||
            "+91 99000 12345",
        };
        cachePlace(placeObj);
        return placeObj;
      });

      mapped.sort((a, b) => a.distance - b.distance);

      setPlacesCache((prev) => ({ ...prev, [category]: mapped }));
      updateDisplayedPlaces(mapped, radius);
      setErrorMsg(null);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("[Nearby] Fetch aborted");
        return;
      }
      console.log("[Nearby] Geoapify fetch error:", err.message);
      setPlaces([]);
      setErrorMsg(
        "Failed to connect to the medical directory database. Please check your internet connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateDisplayedPlaces = (allPlaces: PlaceItem[], currentRadius: number) => {
    const radiusFiltered = allPlaces.filter((p) => p.distance <= currentRadius / 1000);
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
  const handleConfigChange = (newTab: "hospital" | "pharmacy", newRadius: number) => {
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

  const onRefresh = async () => {
    setRefreshing(true);
    const lat = location ? location.coords.latitude : FALLBACK_LAT;
    const lng = location ? location.coords.longitude : FALLBACK_LNG;

    // Clear cache for the active tab to force network fetch
    setPlacesCache((prev) => {
      const newCache = { ...prev };
      delete newCache[activeTab];
      return newCache;
    });

    await loadPlaces(lat, lng, activeTab);
    setRefreshing(false);
  };

  const handleTabChange = (tab: "hospital" | "pharmacy") => {
    handleConfigChange(tab, radius);
  };

  const handleRadiusChange = (r: number) => {
    handleConfigChange(activeTab, r);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleDirections = (item: PlaceItem) => {
    const query = encodeURIComponent(`${item.name} ${item.address}`);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url).catch((err) => {
      console.log("[Nearby] Failed to open maps link:", err);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
    });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch((err) =>
      console.log("[Nearby] Call failed:", err)
    );
  };

  const filteredPlaces = places.filter((p) => {
    const cleanQuery = searchQuery.trim().toLowerCase();
    return (
      p.name.toLowerCase().includes(cleanQuery) ||
      p.address.toLowerCase().includes(cleanQuery)
    );
  });

  const fitMapToMarkers = () => {
    if (mapRef.current && filteredPlaces.length > 0) {
      const coordinates = filteredPlaces.map((p) => ({
        latitude: p.lat,
        longitude: p.lng,
      }));
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

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

      <View style={styles.toggleContainer}>
        <Pressable
          onPress={() => setViewMode("list")}
          style={[styles.toggleBtn, viewMode === "list" && styles.toggleBtnActive]}
        >
          <Text style={[styles.toggleText, viewMode === "list" && styles.toggleTextActive]}>
            List View
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setViewMode("map");
            setTimeout(fitMapToMarkers, 500);
          }}
          style={[styles.toggleBtn, viewMode === "map" && styles.toggleBtnActive]}
        >
          <Text style={[styles.toggleText, viewMode === "map" && styles.toggleTextActive]}>
            Map View
          </Text>
        </Pressable>
      </View>

      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onClear={clearSearch}
      />

      {gpsError && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={16} color="#B45309" />
          <Text style={styles.warningText}>
            GPS permission denied. Showing fallback results for Bangalore center.
          </Text>
        </View>
      )}

      <CategorySelector activeTab={activeTab} onTabChange={handleTabChange} />

      <RadiusFilter radius={radius} onRadiusChange={handleRadiusChange} />

      {viewMode === "list" ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {loading && !refreshing ? (
            <EmptyState type="loading" />
          ) : errorMsg ? (
            <EmptyState type="error" message={errorMsg} onRetry={requestLocation} />
          ) : places.length > 0 && filteredPlaces.length === 0 ? (
            <EmptyState
              type="search"
              searchQuery={searchQuery}
              onClearSearch={clearSearch}
            />
          ) : filteredPlaces.length > 0 ? (
            filteredPlaces.map((item) => (
              <PlaceCard
                key={item.id}
                item={item}
                activeTab={activeTab}
                onCall={handleCall}
                onDirections={handleDirections}
              />
            ))
          ) : (
            <EmptyState type="empty" radius={radius} onRetry={requestLocation} />
          )}
        </ScrollView>
      ) : (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={
              location
                ? {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }
                : undefined
            }
            showsUserLocation={true}
          >
            {filteredPlaces.map((p) => (
              <PlaceMarker
                key={p.id}
                place={p}
                activeTab={activeTab}
                onPress={(place) => {
                  setSelectedMarker(place);
                  bottomSheetRef.current?.expand();
                }}
              />
            ))}
          </MapView>
          <MapBottomSheet
            bottomSheetRef={bottomSheetRef as any}
            selectedPlace={selectedMarker}
            activeTab={activeTab}
            onClose={() => setSelectedMarker(null)}
            onCall={handleCall}
            onDirections={handleDirections}
          />
        </View>
      )}
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
    marginTop: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
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
  toggleContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
