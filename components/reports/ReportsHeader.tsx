import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

export function ReportsHeader() {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>My Reports</Text>
      <Pressable style={styles.btn} onPress={() => router.push('/upload')}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.btnText}>Upload</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title:   { fontSize: 22, fontWeight: '700', color: Colors.text },
  btn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
