import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';

interface Props {
  name: string;
  email: string;
  phone?: string;
}

export function ProfileInfoCard({ name, email, phone }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={36} color={Colors.primary} />
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.meta}>{email}</Text>
      {phone && <Text style={styles.meta}>{phone}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card:   { alignItems: 'center', gap: 6, paddingVertical: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary + '18', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  name:   { fontSize: 20, fontWeight: '700', color: Colors.text },
  meta:   { color: Colors.textMuted, fontSize: 14 },
});
