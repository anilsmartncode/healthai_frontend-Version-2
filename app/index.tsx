import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator, Platform } from 'react-native';

export default function Index() {
  const { token, ready } = useAuth();

  // On web, don't redirect — the web lockdown overlay in _layout.tsx handles everything.
  // Without this guard, the Redirect fights with legal page routes and kicks users away.


  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href={token ? '/(tabs)/home' : '/(auth)/onboarding'} />;
}
