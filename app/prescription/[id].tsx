import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { Colors, Radius } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import {
  reportsApi,
  type ReportListItem,
  type AnalyzeResult,
} from '@/services/reportsApi';
import type { ApiPrescription, ApiPrescriptionMedicine } from '@/types/Report/reportype';
import {
  parsePrescriptionMedicineForReminder,
  batchCreatePrescriptionReminders,
  isMedicineReminderActive,
} from '@/utils/prescriptionReminderHelper';
import { getAllReminders, type Reminder } from '@/services/medicineTabApi';

// ─── Component: Expandable Medicine Card ───
function MedicineCard({
  med,
  existingReminders,
  onSetReminder,
}: {
  med: ApiPrescriptionMedicine;
  existingReminders: Reminder[];
  onSetReminder: (med: ApiPrescriptionMedicine) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = isMedicineReminderActive(med.name, existingReminders);

  return (
    <Pressable
      style={styles.medCard}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={styles.medHeader}>
        <View style={styles.medIconWrap}>
          <Text style={{ fontSize: 18 }}>💊</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.medName}>{med.name}</Text>
          <Text style={styles.medSub}>
            {med.dosage} {med.units} • {med.route || 'Oral'}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={Colors.textMuted}
        />
      </View>

      {/* ── All 3 in a row: Frequency/Timing, Duration, and Set Reminder ── */}
      <View style={styles.medChipsRow}>
        {med.frequency ? (
          <View style={styles.badge}>
            <Ionicons name="time-outline" size={12} color={Colors.primary} />
            <Text style={styles.badgeText}>{med.frequency}</Text>
          </View>
        ) : null}

        {med.duration ? (
          <View style={styles.badge}>
            <Ionicons name="calendar-outline" size={12} color={Colors.primary} />
            <Text style={styles.badgeText}>{med.duration}</Text>
          </View>
        ) : null}

        {status.active ? (
          <View style={styles.reminderActiveBadge}>
            <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
            <Text style={styles.reminderActiveText}>
              {status.times.length > 0 ? `Set (${status.times[0]})` : 'Reminder Set'}
            </Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.setReminderBtn, pressed && { opacity: 0.85 }]}
            onPress={(e) => {
              e.stopPropagation();
              onSetReminder(med);
            }}
          >
            <Ionicons name="notifications-outline" size={12} color={Colors.primary} />
            <Text style={styles.setReminderBtnText}>Set Reminder</Text>
          </Pressable>
        )}
      </View>

      {expanded && (
        <View style={styles.medExpandedContent}>
          <View style={styles.divider} />
          
          {med.why_prescribed && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Why prescribed</Text>
              <Text style={styles.detailText}>{med.why_prescribed}</Text>
            </View>
          )}

          {med.usage_explanation && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>How to use</Text>
              <Text style={styles.detailText}>{med.usage_explanation}</Text>
            </View>
          )}

          {med.instructions && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Instructions</Text>
              <Text style={styles.detailText}>{med.instructions}</Text>
            </View>
          )}

          {med.precautions && med.precautions.length > 0 && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Precautions</Text>
              {med.precautions.map((p, i) => (
                <Text key={i} style={styles.bulletItem}>• {p}</Text>
              ))}
            </View>
          )}

          {med.side_effects_to_watch && med.side_effects_to_watch.length > 0 && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Side Effects to watch</Text>
              {med.side_effects_to_watch.map((p, i) => (
                <Text key={i} style={styles.bulletItem}>• {p}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

// ─── Main Screen ───
export default function PrescriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { phone } = useAuth();
  const [report, setReport] = useState<(ReportListItem & Partial<AnalyzeResult>) | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const fetchReminders = useCallback(async () => {
    try {
      const list = await getAllReminders();
      setReminders(list);
    } catch (e) {
      console.warn('[PrescriptionDetail] Error fetching reminders', e);
    }
  }, []);

  useEffect(() => {
    reportsApi.getById(id ?? '', phone).then((r) => {
      setReport(r);
      setLoading(false);
    });
  }, [id, phone]);

  useFocusEffect(
    useCallback(() => {
      fetchReminders();
    }, [fetchReminders])
  );

  const handleSetIndividualReminder = (med: ApiPrescriptionMedicine) => {
    const parsed = parsePrescriptionMedicineForReminder(med);
    router.push({
      pathname: '/medicines/reminders/new',
      params: {
        medicineId: `rx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        medicineName: parsed.medicineName,
        dosage: parsed.dosage,
        frequency: parsed.frequency,
        whenToTake: parsed.whenToTake,
        time: parsed.times[0] || '08:00 AM',
        totalCount: String(parsed.totalCount),
      },
    });
  };

  const handleBatchAddReminders = async () => {
    if (!report?.prescription?.medicines || report.prescription.medicines.length === 0) return;
    const meds = report.prescription.medicines;

    // Filter to medicines that are not already active
    const unadded = meds.filter((m) => !isMedicineReminderActive(m.name, reminders).active);
    const targetMedicines = unadded.length > 0 ? unadded : meds;

    setBatchLoading(true);
    try {
      const { successCount } = await batchCreatePrescriptionReminders(targetMedicines);
      await fetchReminders();
      if (successCount > 0) {
        Alert.alert(
          'Reminders Scheduled!',
          `Successfully scheduled reminders for ${successCount} prescription medicine dose${successCount > 1 ? 's' : ''}.`,
          [
            { text: 'View Reminders', onPress: () => router.push('/medicines/reminders') },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Notice', 'Could not schedule reminders. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to schedule reminders.');
    } finally {
      setBatchLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!report || !report.prescription) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Error</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} style={{ marginBottom: 10 }} />
          <Text style={{ fontSize: 16, color: Colors.text, textAlign: 'center' }}>
            Prescription details could not be loaded or are not available for this report.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const p = report.prescription;
  
  // Parse summary for emergency/AI explanation if available
  let summaryObj: any = {};
  if (report.summary) {
    summaryObj = typeof report.summary === 'string' ? JSON.parse(report.summary) : report.summary;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Navbar ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Prescription</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        
        {/* ── Emergency Banner ── */}
        {summaryObj?.is_emergency && summaryObj?.emergency_warning && (
          <View style={styles.emergencyBanner}>
            <Ionicons name="alert-circle" size={18} color="#fff" />
            <Text style={styles.emergencyText}>{summaryObj.emergency_warning}</Text>
          </View>
        )}

        {/* ── Doctor & Clinic Header ── */}
        <View style={styles.card}>
          <View style={styles.doctorHeaderRow}>
            <View style={[styles.doctorIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="document-text-outline" size={24} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.doctorName}>
                {!p.doctor_name || p.doctor_name.toLowerCase() === 'unknown' ? 'Doctor Prescription' : p.doctor_name}
              </Text>
              {(p.hospital_name || report.labName) && (
                <Text style={styles.clinicName}>
                  {!p.hospital_name || p.hospital_name.toLowerCase() === 'unknown' ? report.labName : p.hospital_name}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.divider} />
          
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{p.prescription_date || report.date || 'Not specified'}</Text>
            </View>
            {p.diagnosis && p.diagnosis.toLowerCase() !== 'unknown' && (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Diagnosis</Text>
                <Text style={styles.metaValue}>{p.diagnosis}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── AI Summary (if any) ── */}
        {(summaryObj?.ai_summary || summaryObj?.patient_friendly_explanation) && (
          <View style={styles.card}>
            <View style={styles.aiHeader}>
              <Text style={styles.cardTitle}>AI Summary</Text>
              <View style={styles.aiBadge}>
                <Ionicons name="sparkles" size={12} color="#fff" />
                <Text style={styles.aiBadgeText}>HealthAI</Text>
              </View>
            </View>
            
            {summaryObj.ai_summary && (
              <Text style={styles.bodyText}>{summaryObj.ai_summary}</Text>
            )}
            
            {summaryObj.patient_friendly_explanation && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.detailTitle}>In Simple Words</Text>
                <Text style={styles.bodyText}>{summaryObj.patient_friendly_explanation}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Medicines ── */}
        {p.medicines && p.medicines.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Prescribed Medicines</Text>

              {p.medicines.every((m) => isMedicineReminderActive(m.name, reminders).active) ? (
                <View style={styles.allScheduledHeaderBadge}>
                  <Ionicons name="checkmark-circle" size={13} color="#16A34A" />
                  <Text style={styles.allScheduledHeaderText}>All Reminders Set</Text>
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.headerAddAllBtn,
                    pressed && { opacity: 0.8 },
                    batchLoading && { opacity: 0.6 },
                  ]}
                  disabled={batchLoading}
                  onPress={handleBatchAddReminders}
                >
                  {batchLoading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="notifications-outline" size={13} color={Colors.primary} />
                      <Text style={styles.headerAddAllBtnText}>+ Add All Reminders</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>

            {p.medicines.map((m, idx) => (
              <MedicineCard
                key={idx}
                med={m}
                existingReminders={reminders}
                onSetReminder={handleSetIndividualReminder}
              />
            ))}
          </View>
        )}

        {/* ── Instructions & Precautions ── */}
        {(p.instructions?.length || p.precautions?.length || p.follow_up) ? (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { marginBottom: 12 }]}>General Instructions</Text>
            
            {p.instructions && p.instructions.length > 0 && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailTitle}>To-do</Text>
                {p.instructions.map((ins, i) => (
                  <Text key={i} style={styles.bulletItem}>• {ins}</Text>
                ))}
              </View>
            )}

            {p.precautions && p.precautions.length > 0 && (
              <View style={styles.detailBlock}>
                <Text style={[styles.detailTitle, { color: Colors.warning }]}>Precautions</Text>
                {p.precautions.map((prec, i) => (
                  <Text key={i} style={styles.bulletItem}>• {prec}</Text>
                ))}
              </View>
            )}

            {p.follow_up && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailTitle}>Follow-up</Text>
                <Text style={styles.detailText}>{p.follow_up}</Text>
              </View>
            )}
          </View>
        ) : null}

        {/* ── Disclaimer ── */}
        {p.disclaimer && (
          <Text style={styles.disclaimerText}>
            {p.disclaimer}
          </Text>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },

  doctorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doctorIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  clinicName: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  
  metaRow: { flexDirection: 'row', gap: 20 },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  metaValue: { fontSize: 14, color: Colors.text, fontWeight: '500' },

  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7C3AED',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  
  bodyText: { fontSize: 14, color: Colors.text, lineHeight: 21 },
  
  emergencyBanner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: Colors.danger,
    borderRadius: Radius.md,
    padding: 12,
  },
  emergencyText: { color: '#fff', flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },

  sectionWrap: { gap: 12 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 6,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  headerAddAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerAddAllBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  allScheduledHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  allScheduledHeaderText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
  },
  
  medCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  medHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  medIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  medSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  
  medChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  setReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
  },
  setReminderBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  reminderActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  reminderActiveText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '600',
  },
  
  medExpandedContent: {
    padding: 16,
    paddingTop: 0,
  },
  detailBlock: { marginBottom: 12 },
  detailTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 4 },
  detailText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  bulletItem: { fontSize: 14, color: Colors.text, lineHeight: 20, marginBottom: 2, paddingLeft: 4 },
  
  disclaimerText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
    paddingHorizontal: 10,
  }
});
