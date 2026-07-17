import { Tabs } from 'expo-router';
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
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: t('nav_home'), tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: t('nav_reports'), tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="ai"
        options={{ title: t('nav_ai'), tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="medicines"
        options={{ title: t('nav_medicines'), tabBarIcon: ({ color, size }) => <Ionicons name="medkit-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('nav_profile'), tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{ href: null, title: 'Chat' }}
      />
    </Tabs>
  );
}
