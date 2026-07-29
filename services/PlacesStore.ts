import { PlaceItem } from "@/components/nearby/types";

const globalPlacesCache: Record<string, PlaceItem> = {};

export const cachePlace = (place: PlaceItem) => {
  globalPlacesCache[place.id] = place;
};

export const getCachedPlace = (id: string): PlaceItem | undefined => {
  return globalPlacesCache[id];
};

export const clearPlacesCache = () => {
  for (const key in globalPlacesCache) {
    delete globalPlacesCache[key];
  }
};
