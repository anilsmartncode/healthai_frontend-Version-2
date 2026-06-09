/**
 * PermissionsEditor.tsx — S5 permission toggle list
 * Mirrors .perm-row items in the HTML reference.
 */
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import type { MemberPermissions } from '@/services/familyApi';

const LABELS: Record<keyof MemberPermissions, string> = {
  view_reports:   'View Reports',
  upload_reports: 'Upload Reports',
  view_medicines: 'View Medicines',
  reminders:      'Receive Reminders',
  ai_insights:    'AI Health Insights',
  edit_medical:   'Edit Medical Records',
  full_access:    'Full Access',
  emergency:      'Emergency Access',
};

interface Props {
  permissions: MemberPermissions;
  onChange: (key: keyof MemberPermissions, value: boolean) => void;
}

export function PermissionsEditor({ permissions, onChange }: Props) {
  return (
    <View>
      {(Object.keys(LABELS) as (keyof MemberPermissions)[]).map((key) => (
        <View key={key} style={styles.row}>
          <Text style={styles.label}>{LABELS[key]}</Text>
          <Switch
            value={permissions[key]}
            onValueChange={(v) => onChange(key, v)}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 13, marginBottom: 7 },
  label: { flex: 1, fontSize: 14, color: Colors.text },
});
