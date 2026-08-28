/**
 * OfflineBanner.tsx
 * Shows a sticky banner at the top when the device has no internet.
 * Install: npx expo install @react-native-community/netinfo
 */
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const opacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      const isOffline = !(state.isConnected && state.isInternetReachable !== false);
      setOffline(isOffline);
      Animated.timing(opacity, {
        toValue: isOffline ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
    return unsub;
  }, []);

  if (!offline) return null;

  return (
    <Animated.View style={[styles.banner, { opacity }]}>
      <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  text: { color: '#fff', fontSize: 13, fontWeight: '500' },
});
