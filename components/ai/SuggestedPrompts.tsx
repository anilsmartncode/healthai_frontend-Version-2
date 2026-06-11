import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Colors, Radius } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  prompts: string[];
  onSelect: (p: string) => void;
}

export function SuggestedPrompts({ prompts, onSelect }: Props) {
  if (!prompts.length) return null;
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Ionicons name="bulb-outline" size={13} color={Colors.textMuted} />
        <Text style={styles.label}>Suggested questions</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {prompts.map((p) => (
          <Pressable
            key={p}
            onPress={() => onSelect(p)}
            style={({ pressed }) => [styles.chip, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.chipText} numberOfLines={2}>{p}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:     { paddingHorizontal: 12, paddingBottom: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  label:    { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  row:      { gap: 8, paddingBottom: 2 },
  chip: {
    maxWidth: 200,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.primary + '50',
    backgroundColor: Colors.primary + '0D',
  },
  chipText: { color: Colors.primary, fontSize: 13, fontWeight: '500', lineHeight: 18 },
});
