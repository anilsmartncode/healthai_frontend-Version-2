import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';

export default function TabsLayout() {
  const { t } = useLang();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        headerShown: false,
        tabBarItemStyle: {
          paddingHorizontal: 0,
          marginHorizontal: 0,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
        },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 84 : 60,
          paddingBottom: Platform.OS === 'ios' ? 24 : 6,
          paddingTop: 6,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: t('nav_home'), tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: t('nav_reports'), tabBarIcon: ({ color }) => <Ionicons name="document-text-outline" size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="ai"
        options={{ title: t('ask_ai'), tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="nearby"
        options={{ title: t('nav_nearby'), tabBarIcon: ({ color }) => <Ionicons name="location-outline" size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="medicines"
        options={{ title: t('nav_medicines'), tabBarIcon: ({ color, size }) => <Ionicons name="medkit-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('nav_profile'), tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{ href: null, title: 'Chat' }}
      />
    </Tabs>
  );
}
