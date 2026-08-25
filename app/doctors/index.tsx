import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { router, useFocusEffect } from 'expo-router';
import { Doctor, getDoctors, deleteDoctor } from '@/services/doctorsApi';

export default function DoctorsListScreen() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async () => {
    try {
      const data = await getDoctors();
      setDoctors(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDoctors();
    }, [])
  );

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to open phone dialer.');
    });
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Remove Doctor', `Are you sure you want to remove ${name} from your list?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Remove', 
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoctor(id);
            fetchDoctors();
          } catch (e) {
            Alert.alert('Error', 'Could not remove doctor.');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>Family Doctors</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={doctors}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listPad}
        refreshing={loading}
        onRefresh={fetchDoctors}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 48, opacity: 0.5 }}>👨‍⚕️</Text>
              <Text style={styles.emptyText}>No doctors added yet.</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color={Colors.primary} />
              </View>
              <View style={styles.info}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.name}>{item.name}</Text>
                  {!item.is_mine && (
                    <View style={styles.sharedBadge}>
                      <Text style={styles.sharedBadgeText}>Shared by family</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.spec}>{item.specialty || 'General Physician'}</Text>
                {item.email ? <Text style={styles.email}>{item.email}</Text> : null}
              </View>
              <View style={styles.actionsRow}>
                {item.is_mine && (
                  <>
                    <Pressable hitSlop={8} onPress={() => router.push(`/doctors/${item.id}` as any)}>
                      <Ionicons name="pencil-outline" size={20} color={Colors.textMuted} />
                    </Pressable>
                    <Pressable hitSlop={8} onPress={() => handleDelete(item.id, item.name)}>
                      <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                    </Pressable>
                  </>
                )}
                {!item.is_mine && (
                  <Pressable hitSlop={8} onPress={() => router.push(`/doctors/${item.id}` as any)}>
                    <Ionicons name="information-circle-outline" size={24} color={Colors.primary} />
                  </Pressable>
                )}
              </View>
            </View>
            <Pressable style={styles.callBtn} onPress={() => handleCall(item.phone || '')}>
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.callText}>Call {item.phone}</Text>
            </Pressable>
          </View>
        )}
        ListFooterComponent={
          !loading ? (
            <Pressable style={styles.addDoctorRow} onPress={() => router.push('/doctors/new' as any)}>
              <Text style={styles.addDoctorText}>+ Add Doctor</Text>
            </Pressable>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  listPad: {
    padding: 16,
    gap: 12,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sharedBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sharedBadgeText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '600',
  },
  spec: {
    fontSize: 14,
    color: '#475569',
  },
  email: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  callText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  addDoctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 14,
    marginTop: 8,
  },
  addDoctorText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  }
});
