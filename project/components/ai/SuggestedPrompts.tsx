import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Colors, Radius } from '@/constants/Colors';

const PROMPTS = [
  'What does my TSH result mean?',
  'Is my cholesterol level dangerous?',
  'What foods should I avoid?',
  'When should I see a doctor?',
];

interface Props {
  onSelect: (p: string) => void;
}

export function SuggestedPrompts({ onSelect }: Props) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={styles.label}>Suggested questions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
        {PROMPTS.map((p) => (
          <Pressable key={p} onPress={() => onSelect(p)} style={styles.chip}>
            <Text style={styles.chipText}>{p}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label:    { fontSize: 12, color: Colors.textMuted, marginBottom: 6, fontWeight: '600', textTransform: 'uppercase' },
  chip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  chipText: { color: Colors.primary, fontSize: 13, fontWeight: '500' },
});
