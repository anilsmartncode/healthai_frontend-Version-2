import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function Analyzing() {
  useEffect(() => {
    const t = setTimeout(() => router.replace('/analysis'), 2200);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={styles.c}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.title}>Analyzing Report</Text>
      <Text style={styles.sub}>Reading report… extracting data… generating summary…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12, backgroundColor: Colors.bg },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  sub: { color: Colors.textMuted, textAlign: 'center' },
});
