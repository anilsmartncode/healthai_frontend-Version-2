/**
 * app/medicines/scanner.tsx
 *
 * Medicine Scanner — real API integration.
 *
 * Flow:
 *   1. Idle            — camera frame + Upload from Gallery
 *   2. Processing      — POST /api/medicine-scanner/upload → poll GET result
 *   3. Identified      — show name + confidence
 *   4. Details         — GET /api/medicines/:medicine_id
 *   5. Actions         — Save / Set Reminder / Check Interactions / Ask AI
 *   6. Scan History    — GET /api/medicine-scanner/history
 *
 * API functions from medicineTabApi:
 *   uploadMedicineImage(uri)        → { scanId, status }
 *   getScanResult(scanId)           → ScanResult
 *   getScanMedicineDetails(id)      → Medicine | null
 *   saveScannedMedicine(id)         → { success, message }
 *   getScanHistory()                → ScanHistoryItem[]
 */

import { useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import {
  uploadMedicineImage,
  getScanResult,
  getScanMedicineDetails,
  saveScannedMedicine,
  getScanHistory,
  type ScanResult,
  type ScanHistoryItem,
  type Medicine,
} from '@/services/medicineTabApi';
import { LanguageSelectModal } from '@/components/ui/LanguageSelectModal';
import { ENDPOINTS } from '@/constants/api';
import { api } from '@/services/api';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type ScanView = 'idle' | 'processing' | 'identified' | 'details' | 'actions';

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MedicineScannerScreen() {
  const [view, setView] = useState<ScanView>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [detail, setDetail] = useState<Medicine | null>(null);
  const [progress, setProgress] = useState(0);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingMed, setSavingMed] = useState(false);

  // Translation State
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedCategory, setTranslatedCategory] = useState<string | null>(null);
  const [translatedUses, setTranslatedUses] = useState<string | null>(null);
  const [translatedDosage, setTranslatedDosage] = useState<string | null>(null);
  const [translatedSideEffects, setTranslatedSideEffects] = useState<string[] | null>(null);

  // ── Core scan flow ──────────────────────────────────────────────────────────
  const runScan = useCallback(async (imageUri: string) => {
    setView('processing');
    setProgress(10);
    console.log('[Scanner] runScan START', { imageUri });

    try {
      // Step 1: Upload image
      console.log('[Scanner] uploadMedicineImage REQUEST', { imageUri });
      const t0 = Date.now();
      const { scanId } = await uploadMedicineImage(imageUri);
      console.log('[Scanner] uploadMedicineImage RESPONSE', { scanId, ms: Date.now() - t0 });
      setProgress(50);

      // Step 2: Poll for result (retry up to 5 times, 1s apart)
      let result: ScanResult | null = null;
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        setProgress(50 + (i + 1) * 8);
        const tp = Date.now();
        console.log(`[Scanner] getScanResult POLL attempt=${i + 1}`, { scanId });
        result = await getScanResult(scanId);
        console.log(`[Scanner] getScanResult RESPONSE attempt=${i + 1}`, { status: result.status, medicineFound: result.medicineFound, ms: Date.now() - tp });
        if (result.status === 'done' || result.status === 'failed') break;
      }
      setProgress(100);

      if (!result || result.status === 'failed' || !result.medicineFound) {
        console.warn('[Scanner] medicine NOT identified', { status: result?.status, medicineFound: result?.medicineFound });
        Alert.alert('Not Identified', 'Could not identify a medicine from this image. Please try a clearer photo.');
        setView('idle');
        return;
      }

      console.log('[Scanner] medicine IDENTIFIED', { medicineId: result.medicineId, medicineName: result.medicineName, confidence: result.confidence });
      setScanResult(result);
      setView('identified');
    } catch (e: any) {
      console.error('[Scanner] runScan ERROR', e?.message ?? e);
      Alert.alert('Scan Failed', e?.message ?? 'Something went wrong. Please try again.');
      setView('idle');
    }
  }, []);

  // ── Trigger from camera frame tap (simulates capture) ──────────────────────
  const handleScan = async () => {
    console.log('[Scanner] handleScan: requesting camera permission');
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    console.log('[Scanner] camera permission status:', status);
    if (status !== 'granted') {
      console.warn('[Scanner] camera permission denied');
      Alert.alert('Permission needed', 'Camera permission is required to scan medicines.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled) {
      console.log('[Scanner] camera cancelled by user');
      return;
    }
    if (result.assets[0]) {
      console.log('[Scanner] camera image captured', { uri: result.assets[0].uri });
      await runScan(result.assets[0].uri);
    }
  };

  // ── Gallery pick ────────────────────────────────────────────────────────────
  const handleGallery = async () => {
    console.log('[Scanner] handleGallery: requesting media library permission');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('[Scanner] media library permission status:', status);
    if (status !== 'granted') {
      console.warn('[Scanner] media library permission denied');
      Alert.alert('Permission needed', 'Media library permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled) {
      console.log('[Scanner] gallery pick cancelled by user');
      return;
    }
    if (result.assets[0]) {
      console.log('[Scanner] gallery image selected', { uri: result.assets[0].uri });
      await runScan(result.assets[0].uri);
    }
  };

  // ── View medicine details ────────────────────────────────────────────────
  const handleViewDetails = async () => {
    if (!scanResult?.medicineId) return;
    console.log('[Scanner] getScanMedicineDetails REQUEST', { medicineId: scanResult.medicineId });
    const t0 = Date.now();
    try {
      const med = await getScanMedicineDetails(scanResult.medicineId);
      console.log('[Scanner] getScanMedicineDetails RESPONSE', { name: med?.name, type: med?.type, ms: Date.now() - t0 });
      setDetail(med);
      setView('details');
    } catch (e: any) {
      console.error('[Scanner] getScanMedicineDetails ERROR', e?.message ?? e);
      Alert.alert('Error', 'Could not load medicine details.');
    }
  };

  // ── Save medicine ────────────────────────────────────────────────────────
  const handleSaveMedicine = async () => {
    if (!scanResult?.medicineId) return;
    console.log('[Scanner] saveScannedMedicine REQUEST', { medicineId: scanResult.medicineId, medicineName: scanResult.medicineName });
    setSavingMed(true);
    const t0 = Date.now();
    try {
      const res = await saveScannedMedicine(scanResult.medicineId);
      console.log('[Scanner] saveScannedMedicine RESPONSE', { success: res.success, message: res.message, ms: Date.now() - t0 });
      Alert.alert(
        res.success ? '✓ Saved' : 'Info',
        res.message ?? `${scanResult.medicineName} added to My Medicines.`,
        [
          { text: 'View My Medicines', onPress: () => router.push('/medicines/my-medicines') },
          { text: 'OK', style: 'cancel' },
        ],
      );
    } catch (e: any) {
      console.error('[Scanner] saveScannedMedicine ERROR', e?.message ?? e);
      Alert.alert('Error', e?.message ?? 'Could not save medicine.');
    } finally {
      setSavingMed(false);
    }
  };

  const handleSetReminder = () => {
    router.push({
      pathname: '/medicines/reminders/new',
      params: { medicineId: scanResult?.medicineId, medicineName: scanResult?.medicineName },
    });
  };

  const handleCheckInteractions = () => {
    router.push('/medicines/check-interactions');
  };

  const handleAskAI = () => {
    router.push('/ai-chat');
  };

  const handleReset = () => {
    setView('idle');
    setScanResult(null);
    setDetail(null);
    setProgress(0);
    setTranslatedCategory(null);
    setTranslatedUses(null);
    setTranslatedDosage(null);
    setTranslatedSideEffects(null);
  };

  const handleTranslate = async (langCode: string, langName: string) => {
    if (!detail) return;
    setTranslating(true);
    try {
      const texts: string[] = [];
      const keys: { key: string, index?: number }[] = [];

      if (detail.category) { texts.push(detail.category); keys.push({ key: 'category' }); }
      if (detail.uses) { texts.push(detail.uses); keys.push({ key: 'uses' }); }
      if (detail.dosage) { texts.push(detail.dosage); keys.push({ key: 'dosage' }); }
      if (detail.sideEffects) {
        detail.sideEffects.forEach((se, i) => {
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
            if (meta.key === 'category') setTranslatedCategory(translated);
            if (meta.key === 'uses') setTranslatedUses(translated);
            if (meta.key === 'dosage') setTranslatedDosage(translated);
            if (meta.key === 'sideEffect') newSideEffects.push(translated);
          });
          if (newSideEffects.length > 0) setTranslatedSideEffects(newSideEffects);
        }
      }
    } catch (e) {
      console.warn('[Scanner] Translation failed:', e);
    } finally {
      setTranslating(false);
    }
  };

  // ── Action handlers ─────────────────────────────────────────────────────────
  const openHistory = async () => {
    setHistoryVisible(true);
    if (history.length === 0) {
      console.log('[Scanner] getScanHistory REQUEST');
      setHistoryLoading(true);
      const t0 = Date.now();
      try {
        const items = await getScanHistory();
        console.log('[Scanner] getScanHistory RESPONSE', { count: items.length, ms: Date.now() - t0 });
        setHistory(items);
      } catch (e: any) {
        console.error('[Scanner] getScanHistory ERROR', e?.message ?? e);
      } finally {
        setHistoryLoading(false);
      }
    } else {
      console.log('[Scanner] getScanHistory skipped (already loaded)', { count: history.length });
    }
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderIdle = () => (
    <View style={styles.idleWrap}>
      <Pressable style={styles.cameraFrame} onPress={handleScan}>
        <View style={styles.cornerTL} /><View style={styles.cornerTR} />
        <View style={styles.cornerBL} /><View style={styles.cornerBR} />
        <Ionicons name="camera-outline" size={48} color={Colors.primary} />
        <Text style={styles.cameraLabel}>Scan Medicine</Text>
        <Text style={styles.cameraSub}>Tap to open camera and scan a medicine strip or box</Text>
      </Pressable>

      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.orLine} />
      </View>

      <Pressable style={styles.uploadBtn} onPress={handleGallery}>
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
      <Text style={styles.identifiedName}>{scanResult?.medicineName}</Text>
      {scanResult?.confidence != null && (
        <View style={styles.confidencePill}>
          <View style={styles.confidenceDot} />
          <Text style={styles.confidenceText}>{scanResult.confidence}% Confidence</Text>
        </View>
      )}
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
      <View style={styles.detailHeader}>
        <View style={styles.detailIconWrap}>
          <Ionicons name="medical-outline" size={28} color={Colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.detailName}>{detail?.name ?? scanResult?.medicineName}</Text>
          <Text style={styles.detailForm}>{detail?.type}</Text>
          {detail?.prescriptionType === 'Prescription' && (
            <View style={styles.rxPill}><Text style={styles.rxText}>Prescription Required</Text></View>
          )}
        </View>
        <Pressable 
          onPress={() => setLangModalOpen(true)}
          hitSlop={10}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          disabled={translating}
        >
          {translating ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons name="language" size={20} color={Colors.primary} />
          )}
          <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '600' }}>
            {translating ? 'Translating...' : 'Translate'}
          </Text>
        </Pressable>
      </View>

      {detail?.category ? (
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Category</Text>
          <Text style={styles.infoValue}>{translatedCategory ?? detail.category}</Text>
        </View>
      ) : null}

      {detail?.uses ? (
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Uses</Text>
          <Text style={styles.infoValue}>{translatedUses ?? detail.uses}</Text>
        </View>
      ) : null}

      {detail?.dosage ? (
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Dosage</Text>
          <Text style={styles.infoValue}>{translatedDosage ?? detail.dosage}</Text>
        </View>
      ) : null}

      {(translatedSideEffects || detail?.sideEffects) && (translatedSideEffects || detail?.sideEffects)!.length > 0 ? (
        <View style={styles.infoBlock}>
          <Text style={styles.infoLabel}>Side Effects</Text>
          {(translatedSideEffects ?? detail!.sideEffects).map((s, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bullet} />
              <Text style={styles.infoValue}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {detail?.id && (
        <Pressable onPress={() => router.push(`/medicine/${detail.id}` as any)}>
          <Text style={styles.viewMore}>View More</Text>
        </Pressable>
      )}

      <View style={styles.detailActions}>
        <Pressable style={[styles.primaryBtn, savingMed && { opacity: 0.6 }]} onPress={handleSaveMedicine} disabled={savingMed}>
          {savingMed
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Ionicons name="bookmark-outline" size={16} color="#fff" /><Text style={styles.primaryBtnText}>Save Medicine</Text></>
          }
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
        { icon: 'bookmark-outline', label: 'Save Medicine', sub: 'Add to my medicines', onPress: handleSaveMedicine },
        { icon: 'alarm-outline', label: 'Set Reminder', sub: 'Never miss your dose', onPress: handleSetReminder },
        { icon: 'git-compare-outline', label: 'Check Interactions', sub: 'Check with other medicines', onPress: handleCheckInteractions },
        { icon: 'sparkles-outline', label: 'Ask AI About Medicine', sub: 'Get AI answers', onPress: handleAskAI },
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
        <Pressable onPress={openHistory} hitSlop={8} style={styles.historyBtn}>
          <Ionicons name="time-outline" size={22} color="#64748B" />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {view === 'idle' && renderIdle()}
        {view === 'processing' && renderProcessing()}
        {view === 'identified' && renderIdentified()}
        {view === 'details' && renderDetails()}
        {view === 'actions' && renderActions()}
      </View>

      {/* Bottom bar when details shown */}
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

          {historyLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : history.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Ionicons name="time-outline" size={40} color="#CBD5E1" />
              <Text style={{ fontSize: 15, color: '#94A3B8' }}>No scan history yet</Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(i) => i.scanId}
              contentContainerStyle={{ padding: 16, gap: 10 }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.historyItem}
                  onPress={() => {
                    setHistoryVisible(false);
                    if (item.medicineId) {
                      router.push(`/medicine/${item.medicineId}` as any);
                    }
                  }}
                >
                  <View style={styles.historyIconWrap}>
                    <Ionicons name="medical-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyName}>{item.medicineName}</Text>
                    <Text style={styles.historyMeta} numberOfLines={1}>
                      {new Date(item.scannedAt).toLocaleDateString()} · {item.aiSummary || 'Scanned medicine'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                </Pressable>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>

      <LanguageSelectModal
        visible={langModalOpen}
        onClose={() => setLangModalOpen(false)}
        onSelect={handleTranslate}
      />
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#F1F5F9' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#0F172A', marginHorizontal: 8 },
  historyBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },

  idleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 },
  cameraFrame: { width: '100%', aspectRatio: 1, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative' },
  cornerTL: { position: 'absolute', top: 16, left: 16, width: 28, height: 28, borderTopWidth: 3, borderLeftWidth: 3, borderColor: Colors.primary, borderRadius: 4 },
  cornerTR: { position: 'absolute', top: 16, right: 16, width: 28, height: 28, borderTopWidth: 3, borderRightWidth: 3, borderColor: Colors.primary, borderRadius: 4 },
  cornerBL: { position: 'absolute', bottom: 16, left: 16, width: 28, height: 28, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: Colors.primary, borderRadius: 4 },
  cornerBR: { position: 'absolute', bottom: 16, right: 16, width: 28, height: 28, borderBottomWidth: 3, borderRightWidth: 3, borderColor: Colors.primary, borderRadius: 4 },
  cameraLabel: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  cameraSub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 19, paddingHorizontal: 20 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
  orLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  orText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.primary + '50', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13, width: '100%', justifyContent: 'center' },
  uploadBtnText: { fontSize: 15, fontWeight: '600', color: Colors.primary },

  centeredWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  progressRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 6, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  progressPct: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  processingTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  processingSub: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },

  identifiedCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  identifiedTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  identifiedName: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  confidencePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  confidenceDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  confidenceText: { fontSize: 13, fontWeight: '700', color: '#16A34A' },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, width: '100%' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 14, paddingVertical: 14, width: '100%' },
  outlineBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 32 },
  ghostBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },

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

  actionsWrap: { padding: 16, gap: 10 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 16 },
  actionLabel: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  actionSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  bottomBar: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#E2E8F0' },
  bottomBarBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 13 },
  bottomBarText: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 14 },
  historyIconWrap: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  historyName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  historyMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
});
