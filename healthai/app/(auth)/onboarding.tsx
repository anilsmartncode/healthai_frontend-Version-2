import { View, Text, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Strings } from '@/constants/Strings';

export default function Onboarding() {
  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.brand}>{Strings.appName}</Text>
        <Text style={styles.tagline}>{Strings.tagline}</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🩺</Text>
        <Text style={styles.heroTitle}>Understand Your Health Better with AI</Text>
        <Text style={styles.heroSub}>
          Upload reports, get AI insights, track trends and stay healthy.
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <Button title="Get Started" onPress={() => router.push('/(auth)/language')} />
        <Button title="Already have an account? Login" variant="ghost" onPress={() => router.push('/(auth)/login')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'space-around', backgroundColor: Colors.bg },
  brand: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  tagline: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  hero: { alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  heroEmoji: { fontSize: 96 },
  heroTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', color: Colors.text },
  heroSub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});
