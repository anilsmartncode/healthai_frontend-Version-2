import * as Application from "expo-application";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "device_id";

export const getOrCreateDeviceId = async (): Promise<string> => {
  let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

  if (!deviceId) {
    let baseId: string | null = null;

    if (Platform.OS === "android") {
      baseId = await Application.getAndroidId(); // ✅ FIX
    } else if (Platform.OS === "ios") {
      baseId = await Application.getIosIdForVendorAsync();
    }

    deviceId = `device_${Platform.OS}_${baseId ?? Date.now()}`;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
};

export const clearDeviceId = async () => {
  await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
};
