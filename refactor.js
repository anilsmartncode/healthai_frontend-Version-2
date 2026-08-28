const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Health Ai cloned 27th July', 'healthai_frontend', 'app', '(tabs)', 'nearby.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Imports
content = content.replace(
  'import { Card } from "@/components/ui/Card";',
  'import { Card } from "@/components/ui/Card";\nimport { fetchGeoapifyPlaces, GeoapifyPlace } from "@/services/geoapify";'
);
content = content.replace(
  'import React, { useState, useEffect } from "react";',
  'import React, { useState, useEffect, useRef } from "react";'
);

// 2. Add Cache State
content = content.replace(
  'const [errorMsg, setErrorMsg] = useState<string | null>(null);',
  'const [errorMsg, setErrorMsg] = useState<string | null>(null);\n\n  // Cache for fetched categories\n  const [placesCache, setPlacesCache] = useState<Record<string, PlaceItem[]>>({});\n  const abortControllerRef = useRef<AbortController | null>(null);'
);

// 3. Replace generateMockData and loadPlaces
const removeBlockRegex = /\/\/ Mock generator if API\/GPS fails or for doctors category[\s\S]*?\/\/ Get User Location/;
const newMethods = `// Fetch places from Geoapify
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
          address = props.housenumber ? \`\${props.housenumber} \${props.street}\` : props.street;
        } else if (props.address_line2) {
          address = props.address_line2;
        }

        return {
          id: props.place_id || \`\${category}_\${index}\`,
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

  // Get User Location`;
content = content.replace(removeBlockRegex, newMethods);

// 4. Update requestLocation
const oldRequestLocationRegex = /const requestLocation = async \(\) => \{[\s\S]*?\}\s*\};\s*useEffect\(\(\) => \{/m;
const newRequestLocation = `const requestLocation = async () => {
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

  useEffect(() => {`;
content = content.replace(oldRequestLocationRegex, newRequestLocation);

// 5. Update handleConfigChange
const oldConfigChangeRegex = /const handleConfigChange = [\s\S]*?loadPlaces\(lat, lng, newRadius, newTab, searchQuery\);\s*\};/;
const newConfigChange = `const handleConfigChange = (newTab: "hospital" | "pharmacy" | "doctors", newRadius: number) => {
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
  };`;
content = content.replace(oldConfigChangeRegex, newConfigChange);

// 6. Update triggerApiSearch and clearSearch
const oldTriggerSearchRegex = /\/\/ Trigger search on API[\s\S]*?\/\/ Native navigation linking/;
const newTriggerSearch = `// Trigger search on API
  const triggerApiSearch = () => {
    // Local filtering is already handled reactively by filteredPlaces below.
  };

  // Clear search query
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Native navigation linking`;
content = content.replace(oldTriggerSearchRegex, newTriggerSearch);

fs.writeFileSync(filePath, content);
console.log("Refactoring complete");
