import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';

const MENU = [
  { icon: 'person-outline',        label: 'Account',       route: '/account' },
  { icon: 'notifications-outline', label: 'Notifications', route: '/notifications' },
  { icon: 'people-outline',        label: 'Care Hub',      route: '/family' },
  { icon: 'shield-checkmark-outline', label: 'Privacy',    route: null },
  { icon: 'help-circle-outline',   label: 'Help & Support',route: null },
] as const;

export function ProfileMenuList() {
  return (
    <Card style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
      {MENU.map((item, i) => (
        <Pressable
          key={item.label}
          onPress={() => item.route && router.push(item.route as any)}
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.bg }, i !== 0 && styles.divider]}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
          </View>
          <Text style={styles.label}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </Pressable>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  divider: { borderTopWidth: 1, borderColor: Colors.border },
  iconWrap:{ width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary + '18', justifyContent: 'center', alignItems: 'center' },
  label:   { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
});
