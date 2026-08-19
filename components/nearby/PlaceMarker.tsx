import React from "react";
import { View, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import { PlaceItem } from "./types";

interface PlaceMarkerProps {
  place: PlaceItem;
  activeTab: "hospital" | "pharmacy" | "diagnostic";
  onPress: (place: PlaceItem) => void;
}

export default function PlaceMarker({ place, activeTab, onPress }: PlaceMarkerProps) {
  const isHospital = activeTab === "hospital";
  const pinColor = isHospital ? "#F43F5E" : "#0F766E";

  return (
    <Marker
      coordinate={{ latitude: place.lat, longitude: place.lng }}
      onPress={() => onPress(place)}
      anchor={{ x: 0.5, y: 1 }} // Anchor at the tip of the arrow
    >
      <View style={styles.container}>
        {/* The Circular Body */}
        <View style={[styles.circle, { backgroundColor: pinColor }]}>
          {/* The Medical Cross */}
          <View style={styles.crossContainer}>
            <View style={styles.crossVertical} />
            <View style={styles.crossHorizontal} />
          </View>
        </View>

        {/* The Pointy Arrow */}
        <View style={[styles.arrow, { borderTopColor: pinColor }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: 18,
    height: 18,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 2, // Keep circle above arrow
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1, // Seamlessly connect to circle
    zIndex: 1,
  },
  crossContainer: {
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  crossVertical: {
    position: "absolute",
    width: 4,
    height: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
  crossHorizontal: {
    position: "absolute",
    width: 14,
    height: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
});



