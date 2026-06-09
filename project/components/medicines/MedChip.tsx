import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';

interface Props {
  name: string;
  onRemove: () => void;
}

export function MedChip({ name, onRemove }: Props) {
  return (
    <Card style={styles.row}>
      <Ionicons name="medical-outline" size={20} color={Colors.primary} />
      <Text style={{ flex: 1, color: Colors.text, fontWeight: '600' }}>{name}</Text>
      <Pressable onPress={onRemove}>
        <Ionicons name="close-circle" size={22} color={Colors.danger} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
