/**
 * components/medicine/MedicineScanner.tsx
 * Full Medicine Scanner feature:
 *  1. Open Scanner (camera or gallery)
 *  2. Upload & Processing (progress)
 *  3. Medicine Identified result
 *  4. Medicine Details view
 *  5. Actions (Save / Reminder / Interactions)
 *  6. Scan History
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing } from '@/constants/Colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  uploadMedicineImage,
  getScanResult,
  getMedicineDetails,
  saveScannedMedicine,
  getScanHistory,
} from '@/services/medicineTabApi';
import type { Medicine, ScanHistoryItem } from '@/services/medicineTabApi';

// ─── Types ────────────────────────────────────────────────────
type ScannerView = 'home' | 'processing' | 'result' | 'detail' | 'history';

// ─── Processing Ring ──────────────────────────────────────────
function ProcessingRing({ progress }: { progress: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (progress / 100) * circ;

  return (
    <View style={styles.ringWrap}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} stroke={Colors.border} strokeWidth="8" fill="none" />
        <circle
          cx="70"
          cy="70"
          r={r}
          stroke={Colors.primary}
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
      </svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringPercent}>{progress}%</Text>
      </View>
    </View>
  );
}

// Since SVG is not standard in RN, we'll use a simple animated ring via View
function AnimatedRing({ progress }: { progress: number }) {
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (progress / 100) * circumference;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      {/* Background ring */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: Colors.border,
        }}
      />
      {/* Filled ring via clip trick */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: Colors.primary,
          borderTopColor: progress > 75 ? Colors.primary : 'transparent',
          borderRightColor: progress > 25 ? Colors.primary : 'transparent',
          borderBottomColor: progress > 50 ? Colors.primary : 'transparent',
          borderLeftColor: Colors.primary,
          transform: [{ rotate: `${(progress / 100) * 360 - 90}deg` }],
        }}
      />
      <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.primary }}>{progress}%</Text>
    </View>
  );
}

// ─── Scan History Item ─────────────────────────────────────────
function HistoryRow({ item, onPress }: { item: ScanHistoryItem; onPress: () => void }) {
  const date = new Date(item.scannedAt);
  const formatted = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.historyRow}>
        <View style={styles.historyIcon}>
          <Ionicons name="medkit-outline" size={22} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.historyName}>{item.medicineName}</Text>
          <Text style={styles.historyMeta}>{item.medicineType}</Text>
          <Text style={styles.historyDate}>{formatted}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </Card>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function MedicineScanner() {
  const [view, setView] = useState<ScannerView>('home');
  const [progress, setProgress] = useState(0);
  const [scannedMed, setScannedMed] = useState<Medicine | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate scanning flow
  const startScan = async (fromGallery = false) => {
    setView('processing');
    setError(null);
    setProgress(0);
    setSaved(false);

    // Animate progress
    const steps = [20, 45, 65, 80, 100];
    for (const p of steps) {
      await new Promise((r) => setTimeout(r, 400));
      setProgress(p);
    }

    try {
      // API 1: Upload image (using a dummy URI)
      const { scanId } = await uploadMedicineImage('dummy_uri');

      // API 2: Get scan result
      const result = await getScanResult(scanId);

      if (!result.medicineFound || !result.medicineId) {
        setError('Unable to identify medicine. Please try again.');
        setView('home');
        return;
      }

      setConfidence(result.confidence ?? 0);

      // API 3: Get medicine details
      const med = await getMedicineDetails(result.medicineId);
      if (!med) {
        setError('Medicine not found in our database.');
        setView('home');
        return;
      }

      setScannedMed(med);
      setView('result');
    } catch (e) {
      setError('Something went wrong. Please try again.');
      setView('home');
    }
  };

  const loadHistory = async () => {
    setView('history');
    setHistoryLoading(true);
    const hist = await getScanHistory();
    setScanHistory(hist);
    setHistoryLoading(false);
  };

  const handleSave = async () => {
    if (!scannedMed) return;
    setSaving(true);
    await saveScannedMedicine(scannedMed.id);
    setSaved(true);
    setSaving(false);
    Alert.alert('✓ Saved', 'Medicine saved to My Medicines.');
  };

  // ── Home Screen ─────────────────────────────────────────────
  if (view === 'home') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.scannerFrame}>
          <View style={styles.frameCornerTL} />
          <View style={styles.frameCornerTR} />
          <View style={styles.frameCornerBL} />
          <View style={styles.frameCornerBR} />
          <Ionicons name="camera-outline" size={48} color={Colors.primary} />
          <Text style={styles.frameHint}>Position the medicine within the frame</Text>
        </View>

        {error && (
          <Card style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={20} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        <Button title="Scan Medicine" onPress={() => startScan(false)} style={{ marginTop: 8 }} />

        <Pressable style={styles.galleryBtn} onPress={() => startScan(true)}>
          <Ionicons name="images-outline" size={20} color={Colors.primary} />
          <Text style={styles.galleryText}>Upload from Gallery</Text>
        </Pressable>

        <Pressable style={styles.historyBtn} onPress={loadHistory}>
          <Ionicons name="time-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.historyBtnText}>View Scan History</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ── Processing Screen ───────────────────────────────────────
  if (view === 'processing') {
    return (
      <View style={styles.processingContainer}>
        <AnimatedRing progress={progress} />
        <Text style={styles.processingTitle}>
          {progress < 60 ? 'Uploading Image…' : 'Extracting & Identifying…'}
        </Text>
        <Text style={styles.processingHint}>Please hold still</Text>
      </View>
    );
  }

  // ── Result Screen ───────────────────────────────────────────
  if (view === 'result' && scannedMed) {
    return (
      <View style={styles.container}>
        <View style={styles.resultHeader}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
          </View>
          <Text style={styles.resultTitle}>Medicine Identified!</Text>
        </View>

        <Card style={styles.resultCard}>
          <View style={styles.resultMedRow}>
            <View style={styles.medIconLg}>
              <Ionicons name="medkit-outline" size={28} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.resultMedName}>{scannedMed.name}</Text>
              <Text style={styles.resultMedType}>{scannedMed.type}</Text>
            </View>
          </View>
          <View style={styles.confidenceBadge}>
            <Ionicons name="analytics-outline" size={14} color={Colors.success} />
            <Text style={styles.confidenceText}>{confidence}% Confidence</Text>
          </View>
        </Card>

        <View style={styles.resultActions}>
          <Button title="View Full Details" onPress={() => setView('detail')} />
          <Button title="Scan Again" variant="outline" onPress={() => setView('home')} />
        </View>
      </View>
    );
  }

  // ── Detail Screen ───────────────────────────────────────────
  if (view === 'detail' && scannedMed) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back */}
        <Pressable onPress={() => setView('result')} style={styles.backRow}>
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={styles.backText}>Back to Result</Text>
        </Pressable>

        {/* Header */}
        <View style={styles.detailHeader}>
          <View style={styles.medIconLg}>
            <Ionicons name="medkit-outline" size={32} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailName}>{scannedMed.name}</Text>
            <Text style={styles.detailSub}>{scannedMed.type} · {scannedMed.category}</Text>
          </View>
        </View>

        {/* Info sections */}
        {[
          { icon: 'flask-outline', title: 'Uses', body: scannedMed.uses },
          { icon: 'timer-outline', title: 'Dosage', body: scannedMed.dosage },
          { icon: 'warning-outline', title: 'Side Effects', body: scannedMed.sideEffects.map((s) => `• ${s}`).join('\n') },
        ].map((s) => (
          <Card key={s.title} style={{ gap: 6, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name={s.icon as any} size={16} color={Colors.primary} />
              <Text style={styles.infoTitle}>{s.title}</Text>
            </View>
            <Text style={styles.infoBody}>{s.body}</Text>
          </Card>
        ))}

        {/* Actions */}
        <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text, marginTop: 8, marginBottom: 8 }}>
          What would you like to do?
        </Text>
        {[
          { icon: 'bookmark-outline', label: 'Save Medicine', sub: 'Add to my medicines', onPress: handleSave },
          { icon: 'alarm-outline', label: 'Set Reminder', sub: 'Never miss your dose', onPress: () => Alert.alert('Reminder', 'Navigate to Reminder tab') },
          { icon: 'git-compare-outline', label: 'Check Interactions', sub: 'Check with other medicines', onPress: () => Alert.alert('Interactions', 'Navigate to Interaction Checker') },
          { icon: 'sparkles-outline', label: 'Ask AI About Medicine', sub: 'Get AI answers', onPress: () => Alert.alert('AI', 'Navigate to AI tab') },
        ].map((a) => (
          <Pressable key={a.label} onPress={a.onPress}>
            <Card style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <Ionicons name={a.icon as any} size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionLabel}>{a.label}</Text>
                <Text style={styles.actionSub}>{a.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  // ── History Screen ──────────────────────────────────────────
  if (view === 'history') {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <Pressable onPress={() => setView('home')} style={[styles.backRow, { marginHorizontal: Spacing.md, marginTop: Spacing.md }]}>
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={styles.backText}>Back to Scanner</Text>
        </Pressable>
        <Text style={[styles.detailName, { marginHorizontal: Spacing.md, marginTop: 8, marginBottom: 4 }]}>
          Scan History
        </Text>

        {historyLoading ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={scanHistory}
            keyExtractor={(i) => i.scanId}
            contentContainerStyle={{ padding: Spacing.md, gap: 8 }}
            renderItem={({ item }) => (
              <HistoryRow
                item={item}
                onPress={async () => {
                  const med = await getMedicineDetails('1'); // use scanId to look up in real API
                  setScannedMed(med);
                  setView('detail');
                }}
              />
            )}
            ListEmptyComponent={
              <Text style={{ color: Colors.textMuted, textAlign: 'center', marginTop: 40 }}>
                No scan history yet.
              </Text>
            }
          />
        )}
      </View>
    );
  }

  return null;
}

// ─── Styles ───────────────────────────────────────────────────
const CORNER_SIZE = 20;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, gap: 12 },

  scannerFrame: {
    height: 220,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary + '08',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
    position: 'relative',
  },
  frameHint: { color: Colors.textMuted, fontSize: 14 },
  frameCornerTL: { position: 'absolute', top: 16, left: 16, width: CORNER_SIZE, height: CORNER_SIZE, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderColor: Colors.primary },
  frameCornerTR: { position: 'absolute', top: 16, right: 16, width: CORNER_SIZE, height: CORNER_SIZE, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderColor: Colors.primary },
  frameCornerBL: { position: 'absolute', bottom: 16, left: 16, width: CORNER_SIZE, height: CORNER_SIZE, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderColor: Colors.primary },
  frameCornerBR: { position: 'absolute', bottom: 16, right: 16, width: CORNER_SIZE, height: CORNER_SIZE, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderColor: Colors.primary },

  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  galleryText: { color: Colors.primary, fontWeight: '600', fontSize: 15 },

  historyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
  historyBtnText: { color: Colors.textMuted, fontSize: 13 },

  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.danger + '10', borderColor: Colors.danger + '30' },
  errorText: { color: Colors.danger, flex: 1 },

  processingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  processingTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  processingHint: { fontSize: 13, color: Colors.textMuted },
  ringWrap: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  ringCenter: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  ringPercent: { fontSize: 24, fontWeight: '800', color: Colors.primary },

  resultHeader: { alignItems: 'center', gap: 8, marginBottom: 8 },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  resultCard: { gap: 10 },
  resultMedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medIconLg: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultMedName: { fontSize: 17, fontWeight: '700', color: Colors.text },
  resultMedType: { fontSize: 13, color: Colors.textMuted },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  confidenceText: { fontSize: 12, fontWeight: '700', color: Colors.success },
  resultActions: { gap: 10, marginTop: 4 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { color: Colors.primary, fontWeight: '600' },

  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  detailName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  detailSub: { fontSize: 13, color: Colors.textMuted },

  infoTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  infoBody: { fontSize: 13, color: Colors.text, lineHeight: 20 },

  actionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  actionSub: { fontSize: 12, color: Colors.textMuted },

  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  historyMeta: { fontSize: 12, color: Colors.textMuted },
  historyDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
});
