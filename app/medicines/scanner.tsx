/**
 * app/medicines/scanner.tsx
 *
 * Medicine Scanner — dedicated screen.
 * Follows the scanner flow from the design doc (Image 3):
 *   1. Open Scanner — camera placeholder + Upload from Gallery option
 *   2. Capture / Upload Image — shows camera view
 *   3. Uploading & Processing — POST /api/medicine-scanner/upload  (~1.0–1.5s)
 *   4. Medicine Identified — GET /api/medicine-scanner/result/:scan_id (~0.8–1.2s)
 *   5. Medicine Details — GET /api/medicines/:medicine_id (~0.8–1.2s)
 *   6. Actions: Save Medicine / Set Reminder / Check Interactions / Ask AI
 *   7. Scan History — GET /api/medicine-scanner/history (~0.5–1.0s)
 *
 * All data is mock; replace stubs with real API calls.
 * Look for ← plug in your API comments throughout.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Spacing } from '@/constants/Colors';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ScanView = 'idle' | 'processing' | 'identified' | 'details' | 'actions';

interface ScanResult {
  scanId: string;
  medicineId: string;
  name: string;
  form: string;
  confidence: number;
}

interface MedicineDetail {
  id: string;
  name: string;
  form: string;
  category: string;
  uses: string;
  dosage: string;
  sideEffects: string[];
  rx: boolean;
}

interface ScanHistoryItem {
  id: string;
  name: string;
  form: string;
  scannedAt: string;
  confidence: number;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// ← plug in your API: POST /api/medicine-scanner/upload → scan_id
// ← plug in your API: GET  /api/medicine-scanner/result/:scan_id
const MOCK_SCAN_RESULT: ScanResult = {
  scanId: '101',
  medicineId: '55',
  name: 'Metformin 500mg',
  form: 'Tablet',
  confidence: 98,
};

// ← plug in your API: GET /api/medicines/:medicine_id
const MOCK_MEDICINE_DETAIL: MedicineDetail = {
  id: '55',
  name: 'Metformin 500mg',
  form: 'Tablet',
  category: 'Diabetes',
  uses: 'Used to control high blood sugar in type 2 diabetes.',
  dosage: 'As prescribed by doctor',
  sideEffects: ['Nausea', 'Stomach discomfort'],
  rx: true,
};

// ← plug in your API: GET /api/medicine-scanner/history
const MOCK_HISTORY: ScanHistoryItem[] = [
  { id: 'h1', name: 'Metformin 500mg',   form: 'Tablet', scannedAt: '02 Jun 2026, 10:30 AM', confidence: 98 },
  { id: 'h2', name: 'Aspirin 75mg',      form: 'Tablet', scannedAt: '01 Jun 2026, 08:15 PM', confidence: 94 },
  { id: 'h3', name: 'Paracetamol 500mg', form: 'Tablet', scannedAt: '30 May 2026, 07:45 PM', confidence: 91 },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MedicineScannerScreen() {
  const [view, setView] = useState<ScanView>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [detail, setDetail] = useState<MedicineDetail | null>(null);
  const [progress, setProgress] = useState(0);
  const [historyVisible, setHistoryVisible] = useState(false);

  // Simulate scanning: upload → polling result → details
  const handleScan = async () => {
    setView('processing');
    setProgress(0);

    // Simulate upload + progress
    // ← plug in your API: POST /api/medicine-scanner/upload { image: file }
    for (let i = 0; i <= 75; i += 5) {
      await new Promise((r) => setTimeout(r, 80));
      setProgress(i);
    }
    // ← plug in your API: GET /api/medicine-scanner/result/:scan_id
    await new Promise((r) => setTimeout(r, 500));
    setProgress(100);
    setScanResult(MOCK_SCAN_RESULT);
    setView('identified');
  };

  const handleViewDetails = async () => {
    // ← plug in your API: GET /api/medicines/:medicine_id
    await new Promise((r) => setTimeout(r, 300));
    setDetail(MOCK_MEDICINE_DETAIL);
    setView('details');
  };

  const handleSaveMedicine = async () => {
    if (!scanResult) return;
    // ← plug in your API: POST /api/user/medicines { medicine_id: scanResult.medicineId }
    await new Promise((r) => setTimeout(r, 400));
    Alert.alert(
      '✓ Saved',
      `${scanResult.name} added to My Medicines.`,
      [
        { text: 'View My Medicines', onPress: () => router.push('/medicines/my-medicines') },
        { text: 'OK', style: 'cancel' },
      ],
    );
  };

  const handleSetReminder = () => {
    router.push({
      pathname: '/medicines/reminders/new',
      params: { medicineId: scanResult?.medicineId, medicineName: scanResult?.name },
    });
  };

  const handleCheckInteractions = () => {
    router.push('/medicines/check-interactions');
  };

  const handleAskAI = () => {
    router.push('/(tabs)/ai');
  };

  const handleReset = () => {
    setView('idle');
    setScanResult(null);
    setDetail(null);
    setProgress(0);
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderIdle = () => (
    <View style={styles.idleWrap}>
      {/* Camera frame */}
      <Pressable style={styles.cameraFrame} onPress={handleScan}>
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
        <Ionicons name="camera-outline" size={48} color={Colors.primary} />
        <Text style={styles.cameraLabel}>Scan Medicine</Text>
        <Text style={styles.cameraSub}>Point camera at medicine strip or box</Text>
      </Pressable>

      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.orLine} />
      </View>

      <Pressable style={styles.uploadBtn} onPress={() => Alert.alert('Gallery', 'Open photo gallery')}>
        <Ionicons name="image-outline" size={18} color={Colors.primary} />
        <Text style={styles.uploadBtnText}>Upload from Gallery</Text>
      </Pressable>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.centeredWrap}>
      <View style={styles.progressRing}>
        <Text style={styles.progressPct}>{progress}%</Text>
      </View>
      <Text style={styles.processingTitle}>Processing Image…</Text>
      <Text style={styles.processingSub}>Extracting text and identifying medicine</Text>
    </View>
  );

  const renderIdentified = () => (
    <View style={styles.centeredWrap}>
      <View style={styles.identifiedCircle}>
        <Ionicons name="checkmark" size={36} color="#fff" />
      </View>
      <Text style={styles.identifiedTitle}>Medicine Identified!</Text>
      <Text style={styles.identifiedName}>{scanResult?.name}</Text>
      <Text style={styles.identifiedForm}>{scanResult?.form}</Text>
      <View style={styles.confidencePill}>
        <View style={styles.confidenceDot} />
        <Text style={styles.confidenceText}>{scanResult?.confidence}% Confidence</Text>
      </View>
      <Pressable style={styles.primaryBtn} onPress={handleViewDetails}>
        <Text style={styles.primaryBtnText}>View Details</Text>
      </Pressable>
      <Pressable style={styles.ghostBtn} onPress={handleReset}>
        <Text style={styles.ghostBtnText}>Scan Another</Text>
      </Pressable>
    </View>
  );

  const renderDetails = () => (
    <ScrollView contentContainerStyle={styles.detailsPad} showsVerticalScrollIndicator={false}>
      {/* Medicine header */}
      <View style={styles.detailHeader}>
        <View style={styles.detailIconWrap}>
          <Ionicons name="medical-outline" size={28} color={Colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.detailName}>{detail?.name}</Text>
          <Text style={styles.detailForm}>{detail?.form}</Text>
          {detail?.rx && (
            <View style={styles.rxPill}>
              <Text style={styles.rxText}>Prescription Required</Text>
            </View>
          )}
        </View>
      </View>

      {/* Info blocks */}
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Category</Text>
        <Text style={styles.infoValue}>{detail?.category}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Uses</Text>
        <Text style={styles.infoValue}>{detail?.uses}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Dosage</Text>
        <Text style={styles.infoValue}>{detail?.dosage}</Text>
      </View>
      <View style={styles.infoBlock}>
        <Text style={styles.infoLabel}>Side Effects</Text>
        {detail?.sideEffects.map((s, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bullet} />
            <Text style={styles.infoValue}>{s}</Text>
          </View>
        ))}
      </View>

      {/* View More */}
      <Pressable onPress={() => detail && router.push(`/medicine/${detail.id}` as any)}>
        <Text style={styles.viewMore}>View More</Text>
      </Pressable>

      {/* Action buttons */}
      <View style={styles.detailActions}>
        <Pressable style={styles.primaryBtn} onPress={handleSaveMedicine}>
          <Ionicons name="bookmark-outline" size={16} color="#fff" />
          <Text style={styles.primaryBtnText}>Save Medicine</Text>
        </Pressable>
        <Pressable style={styles.outlineBtn} onPress={handleSetReminder}>
          <Ionicons name="alarm-outline" size={16} color={Colors.primary} />
          <Text style={styles.outlineBtnText}>Set Reminder</Text>
        </Pressable>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );

  const renderActions = () => (
    <View style={styles.actionsWrap}>
      {[
        { icon: 'bookmark-outline', label: 'Save Medicine',         sub: 'Add to my medicines',       onPress: handleSaveMedicine },
        { icon: 'alarm-outline',    label: 'Set Reminder',          sub: 'Never miss your dose',       onPress: handleSetReminder },
        { icon: 'git-compare-outline', label: 'Check Interactions', sub: 'Check with other medicines', onPress: handleCheckInteractions },
        { icon: 'sparkles-outline', label: 'Ask AI About Medicine', sub: 'Get AI answers',             onPress: handleAskAI },
      ].map((a) => (
        <Pressable key={a.label} style={({ pressed }) => [styles.actionItem, pressed && { opacity: 0.75 }]} onPress={a.onPress}>
          <Ionicons name={a.icon as any} size={22} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.actionLabel}>{a.label}</Text>
            <Text style={styles.actionSub}>{a.sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
        </Pressable>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {view === 'details' ? 'Medicine Details' : view === 'actions' ? 'What would you like to do?' : 'Medicine Scanner'}
        </Text>
        <Pressable onPress={() => setHistoryVisible(true)} hitSlop={8} style={styles.historyBtn}>
          <Ionicons name="time-outline" size={22} color="#64748B" />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {view === 'idle'       && renderIdle()}
        {view === 'processing' && renderProcessing()}
        {view === 'identified' && renderIdentified()}
        {view === 'details'    && renderDetails()}
        {view === 'actions'    && renderActions()}
      </View>

      {/* Bottom action bar when details shown */}
      {view === 'details' && (
        <View style={styles.bottomBar}>
          <Pressable style={styles.bottomBarBtn} onPress={() => setView('actions')}>
            <Ionicons name="ellipsis-horizontal" size={18} color={Colors.primary} />
            <Text style={styles.bottomBarText}>More Actions</Text>
          </Pressable>
          <Pressable style={[styles.bottomBarBtn, { backgroundColor: Colors.primary }]} onPress={handleReset}>
            <Ionicons name="scan-outline" size={18} color="#fff" />
            <Text style={[styles.bottomBarText, { color: '#fff' }]}>Scan Another</Text>
          </Pressable>
        </View>
      )}

      {/* Scan History Modal */}
      <Modal visible={historyVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setHistoryVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Scan History</Text>
            <Pressable onPress={() => setHistoryVisible(false)} hitSlop={8}>
              <Ionicons name="close" size={22} color="#64748B" />
            </Pressable>
          </View>
          <FlatList
            data={MOCK_HISTORY}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <Pressable style={styles.historyItem} onPress={() => { setHistoryVisible(false); router.push(`/medicines/browse` as any); }}>
                <View style={styles.historyIconWrap}>
                  <Ionicons name="medical-outline" size={18} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyName}>{item.name}</Text>
                  <Text style={styles.historyMeta}>{item.form} · {item.scannedAt}</Text>
                </View>
                <View style={styles.confPill}>
                  <Text style={styles.confText}>{item.confidence}%</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F1F5F9' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#0F172A', marginHorizontal: 8 },
  historyBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  content: { flex: 1 },

  // Idle
  idleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 },
  cameraFrame: { width: '100%', aspectRatio: 1, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative' },
  cornerTL: { position: 'absolute', top: 16, left: 16, width: 28, height: 28, borderTopWidth: 3, borderLeftWidth: 3, borderColor: Colors.primary, borderRadius: 4 },
  cornerTR: { position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderTopWidth: 3, borderRightWidth: 3, borderColor: Colors.primary, borderRadius: 4 },
  cornerBL: { position: 'absolute', bottom: 16, left: 16, width: 28, height: 28, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: Colors.primary, borderRadius: 4 },
  cornerBR: { position: 'absolute', bottom: 16, right: 16, width: 28, height: 28, borderBottomWidth: 3, borderRightWidth: 3, borderColor: Colors.primary, borderRadius: 4 },
  cameraLabel: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  cameraSub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 19 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
  orLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  orText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.primary + '50', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13, width: '100%', justifyContent: 'center' },
  uploadBtnText: { fontSize: 15, fontWeight: '600', color: Colors.primary },

  // Processing
  centeredWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  progressRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 6, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  progressPct: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  processingTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  processingSub: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },

  // Identified
  identifiedCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  identifiedTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  identifiedName: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  identifiedForm: { fontSize: 14, color: '#94A3B8' },
  confidencePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  confidenceDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  confidenceText: { fontSize: 13, fontWeight: '700', color: '#16A34A' },

  // Buttons
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, width: '100%' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 14, paddingVertical: 14, width: '100%' },
  outlineBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 32 },
  ghostBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },

  // Details
  detailsPad: { padding: 16, gap: 14 },
  detailHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 14 },
  detailIconWrap: { width: 50, height: 50, borderRadius: 12, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  detailName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  detailForm: { fontSize: 13, color: '#94A3B8' },
  rxPill: { marginTop: 4, alignSelf: 'flex-start', backgroundColor: '#FEE2E2', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  rxText: { fontSize: 10, fontWeight: '700', color: '#B91C1C' },
  infoBlock: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 12, gap: 4 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 14, color: '#334155', lineHeight: 21 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bullet: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.primary },
  viewMore: { fontSize: 14, color: Colors.primary, fontWeight: '600', textAlign: 'center' },
  detailActions: { gap: 10 },

  // Actions list
  actionsWrap: { padding: 16, gap: 10 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 16 },
  actionLabel: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  actionSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  // Bottom bar
  bottomBar: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#E2E8F0' },
  bottomBarBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 13 },
  bottomBarText: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  // History modal
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 14 },
  historyIconWrap: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  historyName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  historyMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  confPill: { backgroundColor: '#F0FDF4', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  confText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },
});
