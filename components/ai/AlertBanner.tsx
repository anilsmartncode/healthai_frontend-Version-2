import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';
import type { HealthAlert } from '@/services/aiService';

interface Props {
  alert: HealthAlert;
  onTap: () => void;
  onDismiss: () => void;
}

export function AlertBanner({ alert, onTap, onDismiss }: Props) {
  const isWarning = alert.severity === 'warning';
  const bg    = isWarning ? '#FFF7ED' : '#EFF6FF';
  const border= isWarning ? '#FED7AA' : '#BFDBFE';
  const color = isWarning ? '#C2410C' : Colors.info;
  const icon  = isWarning ? 'warning-outline' : 'information-circle-outline';

  return (
    <Pressable
      onPress={onTap}
      style={({ pressed }) => [styles.wrap, { backgroundColor: bg, borderColor: border }, pressed && { opacity: 0.85 }]}
    >
      <Ionicons name={icon} size={20} color={color} style={{ flexShrink: 0 }} />
      <View style={styles.text}>
        <Text style={[styles.title, { color }]}>{alert.title}</Text>
        <Text style={styles.msg}>{alert.message}</Text>
      </View>
      <Pressable onPress={onDismiss} hitSlop={10}>
        <Ionicons name="close" size={18} color={Colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 12, borderRadius: Radius.lg, borderWidth: 1, padding: 12 },
  text:  { flex: 1 },
  title: { fontSize: 13, fontWeight: '700' },
  msg:   { fontSize: 12, color: Colors.textMuted, marginTop: 1, lineHeight: 17 },
});
