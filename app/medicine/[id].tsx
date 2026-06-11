/**
 * app/medicine/[id].tsx
 *
 * Medicine Detail — loads real medicine data by ID.
 * API: GET /api/medicines/{id}  — getMedicineDetails()
 */

import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getMedicineDetails, saveMedicine, type Medicine } from '@/services/medicineTabApi';
import { AskAIButton } from '@/components/ai/AskAIButton';

export default function MedicineDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saved,    setSaved]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getMedicineDetails(id)
      .then((m) => {
        setMedicine(m);
        if (!m) setError('Medicine not found.');
      })
      .catch(() => setError('Failed to load medicine details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    if (!medicine || saved) return;
    setSaving(true);
    try {
      await saveMedicine(medicine.id);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const rxColor = medicine?.prescriptionType === 'Prescription' ? '#B91C1C' : '#065F46';
  const rxBg    = medicine?.prescriptionType === 'Prescription' ? '#FEE2E2' : '#D1FAE5';

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !medicine) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={Colors.danger} />
          <Text style={styles.errorText}>{error ?? 'Medicine not found.'}</Text>
          <Pressable style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>

        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.iconWrap}>
            <Ionicons name="medical-outline" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.title}>{medicine.name}</Text>
          <Text style={styles.subtitle}>{medicine.type}</Text>
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <View style={[styles.badge, { backgroundColor: rxBg }]}>
              <Text style={[styles.badgeText, { color: rxColor }]}>{medicine.prescriptionType}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.badgeText, { color: '#1D4ED8' }]}>{medicine.category}</Text>
            </View>
          </View>
        </View>

        {/* Info sections */}
        {medicine.uses ? (
          <View style={styles.infoBlock}>
            <View style={styles.infoHeader}>
              <Ionicons name="flask-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoTitle}>Uses</Text>
            </View>
            <Text style={styles.infoBody}>{medicine.uses}</Text>
          </View>
        ) : null}

        {medicine.dosage ? (
          <View style={styles.infoBlock}>
            <View style={styles.infoHeader}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoTitle}>Dosage</Text>
            </View>
            <Text style={styles.infoBody}>{medicine.dosage}</Text>
          </View>
        ) : null}

        {medicine.sideEffects && medicine.sideEffects.length > 0 && (
          <View style={styles.infoBlock}>
            <View style={styles.infoHeader}>
              <Ionicons name="warning-outline" size={18} color="#EA580C" />
              <Text style={styles.infoTitle}>Side Effects</Text>
            </View>
            {medicine.sideEffects.map((s, i) => (
              <View key={i} style={styles.bullet}>
                <View style={styles.bulletDot} />
                <Text style={styles.infoBody}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryBtn, saved && { backgroundColor: '#16A34A' }]}
            onPress={handleSave}
            disabled={saving || saved}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name={saved ? 'checkmark' : 'bookmark-outline'} size={16} color="#fff" />
                <Text style={styles.primaryBtnText}>{saved ? 'Saved' : 'Save Medicine'}</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.outlineBtn}
            onPress={() => router.push({ pathname: '/medicines/reminders/new', params: { medicineId: medicine.id, medicineName: medicine.name } })}
          >
            <Ionicons name="alarm-outline" size={16} color={Colors.primary} />
            <Text style={styles.outlineBtnText}>Set Reminder</Text>
          </Pressable>

          <Pressable
            style={styles.outlineBtn}
            onPress={() => router.push('/medicines/check-interactions')}
          >
            <Ionicons name="git-compare-outline" size={16} color={Colors.primary} />
            <Text style={styles.outlineBtnText}>Check Interactions</Text>
          </Pressable>
        </View>
      {/* Ask AI deep link */}
        <View style={{ paddingHorizontal: 0 }}>
          <AskAIButton
            variant="banner"
            label="Ask AI about this medicine"
            prefill={`Tell me about ${medicine.name} — its uses, side effects, and any important precautions I should know.`}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F8FAFC' },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  page:    { padding: 16, gap: 14 },

  headerCard: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#E2E8F0',
    padding: 20, alignItems: 'center', gap: 8,
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  title:    { fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748B' },
  badge:    { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:{ fontSize: 12, fontWeight: '700' },

  infoBlock: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 0.5, borderColor: '#E2E8F0', padding: 14, gap: 8,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTitle:  { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  infoBody:   { fontSize: 14, color: '#334155', lineHeight: 22 },
  bullet:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulletDot:  { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.primary },

  actions:    { gap: 10 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: 14, paddingVertical: 13,
  },
  outlineBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },

  errorText:    { fontSize: 15, color: Colors.danger, textAlign: 'center' },
  backLink:     { marginTop: 8 },
  backLinkText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
});
