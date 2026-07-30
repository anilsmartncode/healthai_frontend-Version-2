export interface GeoapifyPlace {
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    address_line2?: string;
    distance?: number; // meters from bias
    lat: number;
    lon: number;
    contact?: {
      phone?: string;
    };
    datasource?: {
      raw?: {
        phone?: string;
        opening_hours?: string;
      };
    };
    place_id: string;
  };
}

export const fetchGeoapifyPlaces = async (
  lat: number,
  lng: number,
  radiusMeters: number,
  category: "hospital" | "pharmacy" | "doctors",
  signal?: AbortSignal
): Promise<GeoapifyPlace[]> => {
  const apiKey = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  if (!apiKey) {
    throw new Error("Geoapify API key is missing. Please add EXPO_PUBLIC_GEOAPIFY_API_KEY to your .env file.");
  }

  let geoCategories = "healthcare";
  if (category === "hospital") geoCategories = "healthcare.hospital";
  if (category === "pharmacy") geoCategories = "healthcare.pharmacy,commercial.health_and_beauty.pharmacy";
  // if (category === "doctors") geoCategories = "healthcare.clinic_or_praxis,healthcare.doctor";

  const url = `https://api.geoapify.com/v2/places?categories=${geoCategories}&filter=circle:${lng},${lat},${radiusMeters}&bias=proximity:${lng},${lat}&limit=50&apiKey=${apiKey}`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Geoapify API error: ${response.status}`);
  }

  const data = await response.json();
  return data.features || [];
};
