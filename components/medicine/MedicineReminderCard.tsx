import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Colors, Radius, Spacing } from '@/constants/Colors';

export interface Reminder {
  id: string;
  name: string;
  dose: string;
  times: string[];   // e.g. ['08:00', '20:00']
  frequency: 'daily' | 'weekly' | 'as-needed';
  enabled: boolean;
  icon?: string;     // Ionicons name — leave empty for default pill icon
}

interface Props {
  reminder: Reminder;
  onToggle: (id: string, value: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const FREQ_LABEL: Record<Reminder['frequency'], string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  'as-needed': 'As needed',
};

const FREQ_COLOR: Record<Reminder['frequency'], string> = {
  daily: Colors.primary,
  weekly: Colors.info,
  'as-needed': Colors.warning,
};

export function MedicineReminderCard({ reminder, onToggle, onEdit, onDelete }: Props) {
  return (
    <Card style={[styles.card, !reminder.enabled && styles.cardDisabled]}>
      {/* Left icon */}
      <View style={[styles.iconWrap, { backgroundColor: reminder.enabled ? Colors.primary + '18' : Colors.border }]}>
        <Ionicons
          name={(reminder.icon as any) ?? 'medkit-outline'}
          size={22}
          color={reminder.enabled ? Colors.primary : Colors.textMuted}
        />
      </View>

      {/* Info */}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.name, !reminder.enabled && { color: Colors.textMuted }]} numberOfLines={1}>
          {reminder.name}
        </Text>
        <Text style={styles.dose}>{reminder.dose}</Text>

        {/* Frequency badge + times */}
        <View style={styles.meta}>
          <View style={[styles.badge, { backgroundColor: FREQ_COLOR[reminder.frequency] + '18' }]}>
            <Text style={[styles.badgeText, { color: FREQ_COLOR[reminder.frequency] }]}>
              {FREQ_LABEL[reminder.frequency]}
            </Text>
          </View>
          {reminder.times.map((t) => (
            <View key={t} style={styles.timePill}>
              <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.timeText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Switch
          value={reminder.enabled}
          onValueChange={(v) => onToggle(reminder.id, v)}
          trackColor={{ true: Colors.primary, false: Colors.border }}
          thumbColor="#fff"
          style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
        />
        <View style={styles.iconRow}>
          <Pressable hitSlop={8} onPress={() => onEdit(reminder.id)}>
            <Ionicons name="pencil-outline" size={17} color={Colors.textMuted} />
          </Pressable>
          <Pressable hitSlop={8} onPress={() => onDelete(reminder.id)}>
            <Ionicons name="trash-outline" size={17} color={Colors.danger} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  cardDisabled: { opacity: 0.6 },
  iconWrap:     { width: 46, height: 46, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  name:         { fontSize: 15, fontWeight: '600', color: Colors.text },
  dose:         { fontSize: 12, color: Colors.textMuted },
  meta:         { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  badge:        { borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:    { fontSize: 11, fontWeight: '600' },
  timePill:     { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.surface, borderRadius: Radius.pill, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: Colors.border },
  timeText:     { fontSize: 11, color: Colors.textMuted },
  actions:      { alignItems: 'center', gap: 6 },
  iconRow:      { flexDirection: 'row', gap: 10 },
});
