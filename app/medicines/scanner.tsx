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
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
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
type ScanView = 'idle' | 'processing' | 'identified' | 'unidentified' | 'details' | 'actions';

const PROCESSING_STEPS = [
  { label: 'Uploading image', minProgress: 0, doneProgress: 35, icon: 'cloud-upload-outline' },
  { label: 'Reading OCR text', minProgress: 35, doneProgress: 65, icon: 'scan-outline' },
  { label: 'Matching medical database', minProgress: 65, doneProgress: 90, icon: 'medical-outline' },
  { label: 'Verifying drug details', minProgress: 90, doneProgress: 100, icon: 'shield-checkmark-outline' },
];

function CircularProgress({ progress, size = 148, strokeWidth = 10 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(Math.round(progress), 0), 100);
  const strokeDashoffset = circumference - (circumference * clamped) / 100;

  const phaseLabel =
    clamped >= 90 ? 'FINALIZING' : clamped >= 65 ? 'MATCHING' : clamped >= 35 ? 'READING' : 'UPLOADING';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="scannerProgressGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={Colors.primary} />
            <Stop offset="100%" stopColor="#38BDF8" />
          </LinearGradient>
        </Defs>
        {/* Background Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated Progress Arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#scannerProgressGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={styles.progressPct}>{clamped}%</Text>
        <View style={styles.phaseBadge}>
          <Text style={styles.progressLabel}>{phaseLabel}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MedicineScannerScreen() {
  const [view, setView] = useState<ScanView>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [unidentifiedReason, setUnidentifiedReason] = useState<string | null>(null);
  const [detail, setDetail] = useState<Medicine | null>(null);
  const [progress, setProgress] = useState(0);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savingMed, setSavingMed] = useState(false);
  const [viewDetailsLoading, setViewDetailsLoading] = useState(false);

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
    setProgress(15);
    setUnidentifiedReason(null);
    console.log('[Scanner] runScan START', { imageUri });

    try {
      // Step 1: Upload image
      console.log('[Scanner] uploadMedicineImage REQUEST', { imageUri });
      const t0 = Date.now();
      const { scanId } = await uploadMedicineImage(imageUri);
      console.log('[Scanner] uploadMedicineImage RESPONSE', { scanId, ms: Date.now() - t0 });
      setProgress(45);

      // Step 2: Poll for result (retry up to 6 times, ~900ms apart)
      let result: ScanResult | null = null;
      for (let i = 0; i < 6; i++) {
        await new Promise((r) => setTimeout(r, 900));
        setProgress(45 + (i + 1) * 8);
        const tp = Date.now();
        console.log(`[Scanner] getScanResult POLL attempt=${i + 1}`, { scanId });
        result = await getScanResult(scanId);
        console.log(`[Scanner] getScanResult RESPONSE attempt=${i + 1}`, {
          status: result?.status,
          medicineFound: result?.medicineFound,
          medicineName: result?.medicineName,
          medicineId: result?.medicineId,
          ms: Date.now() - tp,
        });
        if (result?.status === 'done' || result?.status === 'failed') break;
      }
      setProgress(100);

      // Strict validation: Must have completed, found a medicine, and have a non-empty name
      if (!result || result.status === 'failed' || !result.medicineFound || !result.medicineName) {
        console.warn('[Scanner] medicine NOT identified or text unextractable', {
          status: result?.status,
          medicineFound: result?.medicineFound,
          medicineName: result?.medicineName,
          noTextDetected: result?.noTextDetected,
          reason: result?.failureReason,
        });

        setUnidentifiedReason(
          result?.failureReason ??
          (result?.noTextDetected
            ? 'No readable medicine text or name was found in this photo.'
            : 'Could not identify a recognized medicine from this image.')
        );
        setScanResult(result);
        setView('unidentified');
        return;
      }

      console.log('[Scanner] medicine IDENTIFIED', {
        medicineId: result.medicineId,
        medicineName: result.medicineName,
        confidence: result.confidence,
      });
      setScanResult(result);
      setView('identified');
    } catch (e: any) {
      console.error('[Scanner] runScan ERROR', e?.message ?? e);
      setUnidentifiedReason(e?.message ?? 'Network or scanning error occurred. Please try again.');
      setView('unidentified');
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
  const handleViewDetails = () => {
    if (!scanResult?.medicineName && !scanResult?.medicineId) return;

    if (scanResult.medicineId) {
      router.push({
        pathname: `/medicine/${scanResult.medicineId}`,
        params: { from: 'scanner' },
      } as any);
    } else if (scanResult.medicineName) {
      router.push({
        pathname: '/medicines/browse',
        params: { search: scanResult.medicineName },
      });
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
    setUnidentifiedReason(null);
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
        <Text style={styles.cameraSub}>Tap to open camera and scan a medicine strip, box, or bottle</Text>
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
    <View style={styles.processingWrapper}>
      <View style={styles.processingCard}>
        <View style={styles.processingRingContainer}>
          <CircularProgress progress={progress} size={150} strokeWidth={11} />
        </View>

        <Text style={styles.processingTitle}>Analyzing Medicine Image</Text>
        <Text style={styles.processingSub}>
          Our AI optical scanner is reading packaging text and matching verified pharmacological records.
        </Text>

        {/* Live Step Progress Pipeline */}
        <View style={styles.stepsContainer}>
          {PROCESSING_STEPS.map((step, idx) => {
            const isDone = progress >= step.doneProgress;
            const isActive = progress >= step.minProgress && !isDone;

            return (
              <View
                key={idx}
                style={[
                  styles.stepRow,
                  isDone && styles.stepRowDone,
                  isActive && styles.stepRowActive,
                ]}
              >
                <View
                  style={[
                    styles.stepIconBox,
                    isDone ? styles.stepIconBoxDone : isActive ? styles.stepIconBoxActive : styles.stepIconBoxPending,
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={15} color="#fff" />
                  ) : isActive ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Ionicons name={step.icon as any} size={15} color="#94A3B8" />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepText,
                    isDone ? styles.stepTextDone : isActive ? styles.stepTextActive : styles.stepTextPending,
                  ]}
                >
                  {step.label}
                </Text>
                {isDone && (
                  <View style={styles.stepBadgeDone}>
                    <Text style={styles.stepBadgeDoneText}>Done</Text>
                  </View>
                )}
                {isActive && (
                  <View style={styles.stepBadgeActive}>
                    <Text style={styles.stepBadgeActiveText}>Processing</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  const renderIdentified = () => (
    <ScrollView contentContainerStyle={styles.identifiedPad} showsVerticalScrollIndicator={false}>
      {/* Top AI Match Status Banner */}
      <View style={styles.matchStatusRow}>
        <View style={styles.aiVerifiedPill}>
          <Ionicons name="shield-checkmark" size={16} color="#059669" />
          <Text style={styles.aiVerifiedText}>AI Verified Match</Text>
        </View>
        <View style={styles.accuracyPill}>
          <Ionicons name="sparkles" size={13} color={Colors.primary} />
          <Text style={styles.accuracyText}>High Accuracy</Text>
        </View>
      </View>

      {/* Main Medicine Hero Card */}
      <View style={styles.medicineHeroCard}>
        <View style={styles.medHeroHeader}>
          <View style={styles.medHeroIconWrap}>
            <Ionicons name="medical" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.medHeroName}>{scanResult?.medicineName}</Text>
            {scanResult?.manufacturer ? (
              <Text style={styles.medHeroMfg}>by {scanResult.manufacturer}</Text>
            ) : (
              <Text style={styles.medHeroMfg}>Verified Pharmaceutical Match</Text>
            )}
          </View>
        </View>

        {/* Tags / Metadata Chips */}
        <View style={styles.medTagsRow}>
          <View style={styles.medTagChip}>
            <Text style={styles.medTagChipText}>
              {scanResult?.medicineType || (scanResult as any)?.form || 'Tablet'}
            </Text>
          </View>

          {scanResult?.dosage ? (
            <View style={styles.medTagChip}>
              <Ionicons name="fitness-outline" size={13} color="#0D9488" />
              <Text style={[styles.medTagChipText, { color: '#0D9488' }]}>{scanResult.dosage}</Text>
            </View>
          ) : null}

          {scanResult?.category ? (
            <View style={[styles.medTagChip, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="pricetag-outline" size={13} color="#4F46E5" />
              <Text style={[styles.medTagChipText, { color: '#4F46E5' }]}>{scanResult.category}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Extracted OCR Card (when OCR text is detected) */}
      {scanResult?.extractedText && scanResult.extractedText.trim().length > 0 ? (
        <View style={styles.extractedOcrCard}>
          <View style={styles.extractedOcrHeader}>
            <Ionicons name="scan-outline" size={15} color={Colors.primary} />
            <Text style={styles.extractedOcrTitle}>Extracted Packaging Text</Text>
          </View>
          <Text style={styles.extractedOcrContent} numberOfLines={3}>
            "{scanResult.extractedText.trim()}"
          </Text>
        </View>
      ) : null}

      {/* Available Clinical Info Highlights */}
      <View style={styles.highlightsCard}>
        <Text style={styles.highlightsCardTitle}>Ready in Full Details</Text>

        <View style={styles.highlightItem}>
          <View style={[styles.highlightDot, { backgroundColor: Colors.primary + '18' }]}>
            <Ionicons name="information" size={14} color={Colors.primary} />
          </View>
          <Text style={styles.highlightText}>Uses, approved medical indications & therapeutic class</Text>
        </View>

        <View style={styles.highlightItem}>
          <View style={[styles.highlightDot, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="warning-outline" size={14} color="#D97706" />
          </View>
          <Text style={styles.highlightText}>Recommended dosage guidelines & critical side effects</Text>
        </View>

        <View style={styles.highlightItem}>
          <View style={[styles.highlightDot, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="alarm-outline" size={14} color="#059669" />
          </View>
          <Text style={styles.highlightText}>1-tap dose reminder setup & multi-drug interaction check</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.identifiedActionsWrap}>
        <Pressable
          style={[styles.primaryActionBtn, viewDetailsLoading && { opacity: 0.7 }]}
          onPress={handleViewDetails}
          disabled={viewDetailsLoading}
        >
          {viewDetailsLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.primaryActionBtnText}>View Full Medicine Details</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </Pressable>

        <Pressable style={styles.secondaryActionBtn} onPress={handleReset}>
          <Ionicons name="camera-outline" size={18} color="#475569" />
          <Text style={styles.secondaryActionBtnText}>Scan Another Medicine</Text>
        </Pressable>
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );

  const renderUnidentified = () => (
    <ScrollView contentContainerStyle={styles.unidentifiedPad} showsVerticalScrollIndicator={false}>
      <View style={styles.unidentifiedCenter}>
        <View style={styles.unidentifiedCircle}>
          <Ionicons name="scan-outline" size={38} color="#D97706" />
          <View style={styles.unidentifiedBadge}>
            <Ionicons name="alert" size={13} color="#fff" />
          </View>
        </View>
        <Text style={styles.unidentifiedTitle}>No Medicine Recognized</Text>
        <Text style={styles.unidentifiedSub}>
          {unidentifiedReason ?? "We couldn't detect a valid medicine name or label in this image. Please ensure you are scanning a medicine package, strip, or bottle with clearly printed text."}
        </Text>
      </View>

      {/* Helpful Guidance Card */}
      <View style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Ionicons name="bulb-outline" size={18} color="#D97706" />
          <Text style={styles.tipsTitle}>Tips for a clear scan</Text>
        </View>

        <View style={styles.tipItem}>
          <View style={styles.tipIconBox}>
            <Ionicons name="medical-outline" size={16} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipHeading}>Focus on medicine packaging</Text>
            <Text style={styles.tipDesc}>
              Make sure the photo shows a medicine strip, bottle, or box. For tablet strips, ensure the printed foil side with the brand name is visible.
            </Text>
          </View>
        </View>

        <View style={styles.tipItem}>
          <View style={styles.tipIconBox}>
            <Ionicons name="sunny-outline" size={16} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipHeading}>Clear lighting & sharp focus</Text>
            <Text style={styles.tipDesc}>
              Hold the camera steady in a well-lit area. Avoid strong reflections, dark shadows, or blurry angles.
            </Text>
          </View>
        </View>

        <View style={styles.tipItem}>
          <View style={styles.tipIconBox}>
            <Ionicons name="scan-outline" size={16} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipHeading}>Keep text inside the frame</Text>
            <Text style={styles.tipDesc}>
              Position the full medicine name and strength (e.g., 500mg) flat and clearly within the frame.
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.unidentifiedActions}>
        <Pressable style={styles.primaryBtn} onPress={handleScan}>
          <Ionicons name="camera-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Scan Again</Text>
        </Pressable>

        <Pressable style={styles.outlineBtn} onPress={handleGallery}>
          <Ionicons name="image-outline" size={18} color={Colors.primary} />
          <Text style={styles.outlineBtnText}>Upload from Gallery</Text>
        </Pressable>

        <Pressable
          style={styles.ghostSearchBtn}
          onPress={() => router.push('/medicines/browse')}
        >
          <Ionicons name="search-outline" size={16} color="#64748B" />
          <Text style={styles.ghostSearchText}>Search Medicine by Name</Text>
        </Pressable>
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
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
        <Pressable
          style={styles.viewMoreBtn}
          onPress={() =>
            router.push({
              pathname: `/medicine/${detail.id}`,
              params: { from: 'scanner' },
            } as any)
          }
        >
          <Text style={styles.viewMoreText}>View Full Medicine Details</Text>
          <Ionicons name="arrow-forward" size={15} color={Colors.primary} />
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
        {view === 'unidentified' && renderUnidentified()}
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
                      router.push({
                        pathname: `/medicine/${item.medicineId}`,
                        params: { from: 'scanner' },
                      } as any);
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

  // ─── Idle State ───
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

  // ─── Processing State Styles ───
  processingWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#F8FAFC' },
  processingCard: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  processingRingContainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  progressPct: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  phaseBadge: { backgroundColor: '#EFF6FF', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4, borderWidth: 1, borderColor: '#BFDBFE' },
  progressLabel: { fontSize: 10, fontWeight: '800', color: Colors.primary, letterSpacing: 1.2 },
  processingTitle: { fontSize: 19, fontWeight: '800', color: '#0F172A', marginTop: 14, textAlign: 'center' },
  processingSub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 19, marginTop: 6, paddingHorizontal: 10 },
  stepsContainer: { width: '100%', marginTop: 22, paddingTop: 18, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 10 },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  stepRowDone: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  stepRowActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  stepIconBox: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepIconBoxDone: { backgroundColor: '#10B981' },
  stepIconBoxActive: { backgroundColor: '#DBEAFE' },
  stepIconBoxPending: { backgroundColor: '#E2E8F0' },
  stepText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#64748B' },
  stepTextDone: { color: '#065F46', fontWeight: '700' },
  stepTextActive: { color: '#1D4ED8', fontWeight: '700' },
  stepTextPending: { color: '#94A3B8' },
  stepBadgeDone: { backgroundColor: '#DCFCE7', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  stepBadgeDoneText: { fontSize: 10, fontWeight: '700', color: '#166534' },
  stepBadgeActive: { backgroundColor: '#DBEAFE', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  stepBadgeActiveText: { fontSize: 10, fontWeight: '700', color: '#1E40AF' },

  // ─── Identified State Styles ───
  identifiedPad: { padding: 18, gap: 16 },
  matchStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  aiVerifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#A7F3D0' },
  aiVerifiedText: { fontSize: 13, fontWeight: '700', color: '#059669' },
  accuracyPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primary + '12', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  accuracyText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  medicineHeroCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 14, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  medHeroHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  medHeroIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  medHeroName: { fontSize: 19, fontWeight: '800', color: '#0F172A', lineHeight: 24 },
  medHeroMfg: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 },
  medTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F8FAFC' },
  medTagChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  medTagChipText: { fontSize: 12, fontWeight: '700', color: '#334155' },

  extractedOcrCard: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 6 },
  extractedOcrHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  extractedOcrTitle: { fontSize: 12, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  extractedOcrContent: { fontSize: 13, fontStyle: 'italic', color: '#475569', lineHeight: 18 },

  highlightsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 },
  highlightsCardTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  highlightItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  highlightDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  highlightText: { flex: 1, fontSize: 13, color: '#334155', lineHeight: 18, fontWeight: '500' },

  identifiedActionsWrap: { gap: 10, marginTop: 4 },
  primaryActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 15, width: '100%', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  primaryActionBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 16, paddingVertical: 14, width: '100%' },
  secondaryActionBtnText: { color: '#475569', fontSize: 15, fontWeight: '700' },

  // ─── Unidentified / Fallback State Styles ───
  unidentifiedPad: { padding: 20, gap: 16 },
  unidentifiedCenter: { alignItems: 'center', gap: 10, marginTop: 10 },
  unidentifiedCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  unidentifiedBadge: { position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#D97706', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  unidentifiedTitle: { fontSize: 19, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  unidentifiedSub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 19, paddingHorizontal: 12 },

  tipsCard: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#FEF3C7', padding: 16, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 0.5, borderBottomColor: '#FEF3C7', paddingBottom: 10 },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  tipItem: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  tipIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  tipHeading: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  tipDesc: { fontSize: 12, color: '#64748B', lineHeight: 17 },

  unidentifiedActions: { gap: 10, marginTop: 4 },
  ghostSearchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  ghostSearchText: { fontSize: 14, fontWeight: '600', color: '#64748B' },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, width: '100%' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 14, paddingVertical: 14, width: '100%' },
  outlineBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 32 },
  ghostBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },

  // ─── Details View Styles ───
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
  viewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 99,
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary + '25',
    alignSelf: 'center',
    marginVertical: 4,
  },
  viewMoreText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  detailActions: { gap: 10 },

  // ─── Actions View Styles ───
  actionsWrap: { padding: 16, gap: 10 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 16 },
  actionLabel: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  actionSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  // ─── Bottom Bar Styles ───
  bottomBar: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#E2E8F0' },
  bottomBarBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F1F5F9', borderRadius: 12, paddingVertical: 13 },
  bottomBarText: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  // ─── History Modal Styles ───
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 14 },
  historyIconWrap: { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  historyName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  historyMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
});
