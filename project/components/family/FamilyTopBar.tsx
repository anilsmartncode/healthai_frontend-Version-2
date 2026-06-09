/**
 * FamilyTopBar.tsx — Reusable top bar for all Family sub-screens
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface Props {
  title?: string;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRight?: () => void;
}

export function FamilyTopBar({ title, onBack, rightIcon, onRight }: Props) {
  return (
    <View style={styles.bar}>
      {onBack ? (
        <Pressable style={styles.btn} onPress={onBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}

      <Text style={styles.title} numberOfLines={1}>{title ?? ''}</Text>

      {rightIcon && onRight ? (
        <Pressable style={styles.btn} onPress={onRight} hitSlop={8}>
          <Ionicons name={rightIcon} size={22} color={Colors.text} />
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  title:   { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: Colors.text },
  btn:     { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  spacer:  { width: 32 },
});
