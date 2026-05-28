import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Colors, Radius } from '@/constants/Colors';
import { useState } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
];

export default function Language() {
  const [selected, setSelected] = useState('en');
  return (
    <View style={styles.c}>
      <Text style={styles.title}>Choose Language</Text>
      <Text style={styles.sub}>Select your preferred language</Text>
      <FlatList
        data={LANGUAGES}
        keyExtractor={(i) => i.code}
        contentContainerStyle={{ gap: 10, paddingVertical: 16 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelected(item.code)} style={[styles.row, selected === item.code && styles.rowActive]}>
            <Text style={styles.rowText}>{item.label}</Text>
            {selected === item.code && <Text style={{ color: Colors.primary }}>✓</Text>}
          </Pressable>
        )}
      />
      <Button title="Continue" onPress={() => router.push('/(auth)/login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, padding: 24, backgroundColor: Colors.bg },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  sub: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  rowActive: { borderColor: Colors.primary, backgroundColor: '#ECFDF5' },
  rowText: { fontSize: 16, color: Colors.text },
});
