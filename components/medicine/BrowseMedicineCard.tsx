import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Colors, Radius, Spacing } from '@/constants/Colors';

export interface BrowseMedicine {
  id: string;
  name: string;
  genericName?: string;
  category: string;       // e.g. 'Antibiotic', 'Analgesic'
  form: string;           // e.g. 'Tablet', 'Syrup'
  strength?: string;
  requiresPrescription: boolean;
  commonUses?: string[];
}

interface Props {
  medicine: BrowseMedicine;
  onPress: (id: string) => void;
  onCheckInteraction?: (id: string) => void;
  onAddReminder?: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Antibiotic:  Colors.danger,
  Analgesic:   Colors.warning,
  Antidiabetic: Colors.primary,
  Antihypertensive: Colors.info,
  Antacid:     Colors.success,
};

export function BrowseMedicineCard({ medicine, onPress, onCheckInteraction, onAddReminder }: Props) {
  const catColor = CATEGORY_COLORS[medicine.category] ?? Colors.primary;

  return (
    <Pressable onPress={() => onPress(medicine.id)}>
      <Card style={styles.card}>
        {/* Icon */}
        <View style={[styles.icon, { backgroundColor: catColor + '18' }]}>
          <Ionicons name="medkit-outline" size={22} color={catColor} />
        </View>

        {/* Main info */}
        <View style={{ flex: 1, gap: 3 }}>
          <View style={styles.row}>
            <Text style={styles.name} numberOfLines={1}>{medicine.name}</Text>
            {medicine.requiresPrescription && (
              <View style={styles.rxBadge}>
                <Text style={styles.rxText}>Rx</Text>
              </View>
            )}
          </View>

          {medicine.genericName && (
            <Text style={styles.generic} numberOfLines={1}>{medicine.genericName}</Text>
          )}

          {/* Tags */}
          <View style={styles.tags}>
            <Tag label={medicine.category} color={catColor} />
            <Tag label={medicine.form} color={Colors.textMuted} />
            {medicine.strength && <Tag label={medicine.strength} color={Colors.textMuted} />}
          </View>

          {/* Common uses */}
          {medicine.commonUses && medicine.commonUses.length > 0 && (
            <Text style={styles.uses} numberOfLines={1}>
              Used for: {medicine.commonUses.slice(0, 2).join(', ')}
            </Text>
          )}
        </View>

        {/* Quick action icons */}
        <View style={styles.quickActions}>
          {onCheckInteraction && (
            <Pressable hitSlop={8} onPress={() => onCheckInteraction(medicine.id)} style={styles.iconBtn}>
              <Ionicons name="git-compare-outline" size={18} color={Colors.info} />
            </Pressable>
          )}
          {onAddReminder && (
            <Pressable hitSlop={8} onPress={() => onAddReminder(medicine.id)} style={styles.iconBtn}>
              <Ionicons name="alarm-outline" size={18} color={Colors.primary} />
            </Pressable>
          )}
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </View>
      </Card>
    </Pressable>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: color + '14' }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  icon:         { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name:         { fontSize: 15, fontWeight: '600', color: Colors.text, flex: 1 },
  rxBadge:      { backgroundColor: Colors.danger + '18', borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 1 },
  rxText:       { fontSize: 10, fontWeight: '700', color: Colors.danger },
  generic:      { fontSize: 12, color: Colors.textMuted, fontStyle: 'italic' },
  tags:         { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag:          { borderRadius: Radius.pill, paddingHorizontal: 7, paddingVertical: 2 },
  tagText:      { fontSize: 11, fontWeight: '600' },
  uses:         { fontSize: 12, color: Colors.textMuted },
  quickActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn:      { padding: 4 },
});
