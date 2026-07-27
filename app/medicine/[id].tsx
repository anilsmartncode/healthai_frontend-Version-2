/**
 * app/medicine/[id].tsx
 *
 * Medicine Detail — loads real medicine data by ID.
 * API: GET /api/medicines/{id}  — getMedicineDetails()
 *
 * Layout (matches screenshot):
 *  - Header card (name, type, badges)
 *  - Info blocks: Uses, Dosage, Side Effects
 *  - "View More" link
 *  - 4 action rows: Set Reminder | Check Interactions | Ask AI About Medicine | Add to My Medicines
 */

import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getMedicineDetails, saveMedicine, type Medicine } from '@/services/medicineTabApi';
import { LanguageSelectModal } from '@/components/ui/LanguageSelectModal';
import { ENDPOINTS } from '@/constants/api';
import { api } from '@/services/api';

export default function MedicineDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedUses, setTranslatedUses] = useState<string | null>(null);
  const [translatedDosage, setTranslatedDosage] = useState<string | null>(null);
  const [translatedSideEffects, setTranslatedSideEffects] = useState<string[] | null>(null);

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
    } catch (e) {
      console.error('[MedicineDetail] saveMedicine error', e);
      setError('Could not save medicine. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTranslate = async (langCode: string, langName: string) => {
    if (!medicine) return;
    setTranslating(true);
    try {
      const texts: string[] = [];
      const keys: { key: string, index?: number }[] = [];

      if (medicine.uses) { texts.push(medicine.uses); keys.push({ key: 'uses' }); }
      if (medicine.dosage) { texts.push(medicine.dosage); keys.push({ key: 'dosage' }); }
      if (medicine.sideEffects) {
        medicine.sideEffects.forEach((se, i) => {
          texts.push(se); keys.push({ key: 'sideEffect', index: i });
        });
      }

      if (texts.length > 0) {
        const combined = texts.join('\n|||\n');
        const res = await api.request<any>(ENDPOINTS.translateTextPath, {
          method: 'POST',
          body: JSON.stringify({ text: combined, language: langCode }),
        });
        const trText = res?.translate_text ?? res?.translated_text ?? combined;
        const pieces = trText.split(/\|\|\|/g).map((s: string) => s.trim());

        if (pieces.length === texts.length) {
          const newSideEffects: string[] = [];
          keys.forEach((meta, idx) => {
            const translated = pieces[idx];
            if (meta.key === 'uses') setTranslatedUses(translated);
            if (meta.key === 'dosage') setTranslatedDosage(translated);
            if (meta.key === 'sideEffect') newSideEffects.push(translated);
          });
          if (newSideEffects.length > 0) setTranslatedSideEffects(newSideEffects);
        }
      }
    } catch (e) {
      console.warn('[MedicineDetail] Translation failed:', e);
    } finally {
      setTranslating(false);
    }
  };

  const rxColor = medicine?.prescriptionType === 'Prescription' ? '#B91C1C' : '#065F46';
  const rxBg = medicine?.prescriptionType === 'Prescription' ? '#FEE2E2' : '#D1FAE5';

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

        {/* ── Header card ── */}
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
          
          {/* ── Translate Button ── */}
          <Pressable 
            onPress={() => setLangModalOpen(true)}
            hitSlop={10}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: Colors.primary + '10', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99 }}
            disabled={translating}
          >
            {translating ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="language" size={18} color={Colors.primary} />
            )}
            <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '700' }}>
              {translating ? 'Translating...' : 'Translate'}
            </Text>
          </Pressable>
        </View>

        {/* ── Uses ── */}
        {medicine.uses ? (
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>USES</Text>
            <Text style={styles.infoBody}>{translatedUses ?? medicine.uses}</Text>
          </View>
        ) : null}

        {/* ── Dosage ── */}
        {medicine.dosage ? (
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>DOSAGE</Text>
            <Text style={styles.infoBody}>{translatedDosage ?? medicine.dosage}</Text>
          </View>
        ) : null}

        {/* ── Side Effects ── */}
        {(translatedSideEffects || medicine.sideEffects) && (translatedSideEffects || medicine.sideEffects)!.length > 0 && (
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>SIDE EFFECTS</Text>
            {(expanded ? (translatedSideEffects ?? medicine.sideEffects) : (translatedSideEffects ?? medicine.sideEffects)!.slice(0, 2))!.map((s, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.infoBody}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── View More ── */}
        <Pressable
          style={styles.viewMoreWrap}
          onPress={() => setExpanded((v) => !v)}
        >
          <Text style={styles.viewMoreText}>{expanded ? 'View Less' : 'View More'}</Text>
        </Pressable>

        {/* ── 4 Action rows (like screenshot) ── */}
        <View style={styles.actionList}>

          {/* Set Reminder */}
          <Pressable
            style={styles.actionRow}
            onPress={() =>
              router.push(`/medicines/reminders/new?medicineId=${medicine.id}&medicineName=${encodeURIComponent(medicine.name)}`)
            }
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="notifications-outline" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Set Reminder</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </Pressable>

          <View style={styles.actionDivider} />

          {/* Check Interactions */}
          <Pressable
            style={styles.actionRow}
            onPress={() => 
              router.push(`/medicines/check-interactions?medicineId=${medicine.id}&medicineName=${encodeURIComponent(medicine.name)}`)
            }
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="git-compare-outline" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Check Interactions</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </Pressable>

          <View style={styles.actionDivider} />

          {/* Ask AI About Medicine */}
          <Pressable
            style={styles.actionRow}
            onPress={() =>
              router.push({
                pathname: '/ai-chat',
                params: {
                  prefill: `Tell me about ${medicine.name} — its uses, side effects, and any important precautions I should know.`,
                },
              })
            }
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="sparkles-outline" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.actionLabel}>Ask AI About Medicine</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </Pressable>

          <View style={styles.actionDivider} />

          {/* Add to My Medicines */}
          <Pressable
            style={styles.actionRow}
            onPress={handleSave}
            disabled={saving || saved}
          >
            <View style={styles.actionIconWrap}>
              {saving ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons
                  name={saved ? 'bookmark' : 'bookmark-outline'}
                  size={22}
                  color={saved ? '#16A34A' : Colors.primary}
                />
              )}
            </View>
            <Text style={[styles.actionLabel, saved && { color: '#16A34A' }]}>
              {saved ? 'Saved to My Medicines' : 'Add to My Medicines'}
            </Text>
            {!saving && <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />}
          </Pressable>
        </View>

      </ScrollView>

      <LanguageSelectModal
        visible={langModalOpen}
        onClose={() => setLangModalOpen(false)}
        onSelect={handleTranslate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  page: { padding: 16, gap: 14, paddingBottom: 32 },

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
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748B' },
  badge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  // ── Info blocks (label above body, no icon) ──
  infoBlock: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 0.5, borderColor: '#E2E8F0',
    padding: 16, gap: 6,
  },
  infoLabel: {
    fontSize: 11, fontWeight: '700',
    color: '#94A3B8', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 2,
  },
  infoBody: { fontSize: 14, color: '#334155', lineHeight: 22, flex: 1 },
  bullet: { flexDirection: 'row', gap: 6 },
  bulletDot: { fontSize: 14, color: '#334155', lineHeight: 22 },

  // ── View More ──
  viewMoreWrap: { alignItems: 'center', paddingVertical: 4 },
  viewMoreText: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  // ── Action list ──
  actionList: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 0.5, borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16, gap: 14,
  },
  actionIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1E293B' },
  actionDivider: { height: 0.5, backgroundColor: '#F1F5F9', marginLeft: 68 },

  errorText: { fontSize: 15, color: Colors.danger, textAlign: 'center' },
  backLink: { marginTop: 8 },
  backLinkText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
});
