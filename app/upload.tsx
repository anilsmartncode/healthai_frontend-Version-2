/**
 * app/upload.tsx  — Upload Screen
 *
 * Permission fix: camera / gallery / document permissions are requested
 * BEFORE the picker launches, not after.
 * Also shows an AI-analysis consent modal before sending the file.
 */

import {
  View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Radius } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';
import { useAuth } from '@/context/AuthContext';
import { useUsage } from '@/context/UsageContext';
import { reportsApi } from '@/services/reportsApi';
import { generateReportNarrative } from '@/services/aiService';

type PickedFile = { uri: string; name: string; mimeType: string; size?: number; lastModified?: number };

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Allowed types — must mirror backend's accepted list (doc, docx, jpeg, jpg, pdf, png) ──
const ALLOWED_EXTENSIONS = ['doc', 'docx', 'jpeg', 'jpg', 'pdf', 'png'];

function getExtension(name: string): string {
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

// Returns true if the file is acceptable to send to the backend.
// Shows an alert and returns false otherwise — call this right after every
// picker (camera / gallery / document) resolves, before setFile().
function validatePickedFile(name: string): boolean {
  const ext = getExtension(name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    Alert.alert(
      'Unsupported File Type',
      `"${ext ? '.' + ext : 'This file'}" isn't supported. Please choose a JPG, PNG, PDF, DOC, or DOCX file.`,
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
}

// ── Analysis consent modal ─────────────────────────────────────────────────
function AnalysisPermissionModal({
  file, visible, onConfirm, onCancel, isSubmitting, context,
}: {
  file: PickedFile | null;
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  context?: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={perm.overlay}>
        <View style={perm.sheet}>
          <View style={perm.iconWrap}>
            <Ionicons name="shield-checkmark-outline" size={36} color={Colors.primary} />
          </View>

          <Text style={perm.title}>Allow AI Analysis?</Text>
          <Text style={perm.sub}>
            Your {context === 'prescription' ? 'prescription' : 'report'} will be securely sent to our AI to extract {context === 'prescription' ? 'medicines' : 'lab values'} and
            generate health insights. It is never shared with third parties.
          </Text>

          {file && (
            <View style={perm.fileCard}>
              <Ionicons
                name={file.mimeType?.includes('pdf') ? 'document-text-outline' : 'image-outline'}
                size={22}
                color={Colors.primary}
              />
              <View style={perm.fileInfo}>
                <Text style={perm.fileName} numberOfLines={1}>{file.name}</Text>
                {file.size ? <Text style={perm.fileMeta}>{formatBytes(file.size)}</Text> : null}
              </View>
            </View>
          )}

          <View style={perm.bullets}>
            {[
              'Only used to detect lab values & generate insights',
              'Not stored beyond your session unless you save',
              'Encrypted in transit — no third-party sharing',
            ].map((point, i) => (
              <View key={i} style={perm.bullet}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={perm.bulletText}>{point}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={[perm.confirmBtn, isSubmitting && perm.confirmBtnDisabled]}
            onPress={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={perm.confirmText}>{context === 'prescription' ? 'Yes, Analyze Prescription' : 'Yes, Analyze Report'}</Text>
            )}
          </Pressable>
          <Pressable style={perm.cancelBtn} onPress={onCancel}>
            <Text style={perm.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── Main upload screen ─────────────────────────────────────────────────────
export default function Upload() {
  const { t } = useLang();
  const { phone } = useAuth();
  const { canUploadReport, incrementReportUpload, setShowPaywall } = useUsage();
  const { memberId, context } = useLocalSearchParams<{ memberId?: string, context?: string }>();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Belt-and-suspenders guard: a ref (not state) so the check is synchronous
  // and can't be bypassed by two onPress events firing before a re-render
  // commits. This is what actually stops a double-tap from sending two
  // real fetch() calls to /api/analyze-report with the same file.
  const analyzeInFlight = useRef(false);
  // AbortController for the current analyze request — lets the Stop button
  // cancel the in-flight fetch immediately without waiting for the 150s timeout.
  const cancelControllerRef = useRef<AbortController | null>(null);

  // ── Tick elapsed seconds while the "Analyzing Report" overlay is showing,
  //     so the user can see it's actively waiting rather than stuck. ──
  useEffect(() => {
    if (!loading) {
      setElapsedSec(0);
      return;
    }
    const interval = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [loading]);

  // ── Camera: request permission FIRST, then launch ──
  const camera = async () => {
    if (!canUploadReport()) return setShowPaywall(true);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access in your device settings to take a photo of your report.',
        [{ text: 'OK' }]
      );
      return;
    }
    const r = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      const name = a.fileName ?? 'photo.jpg';
      if (!validatePickedFile(name)) return;
      setFile({ uri: a.uri, name, mimeType: a.mimeType ?? 'image/jpeg', size: (a as any).fileSize });
    }
  };

  // ── Gallery: request media-library permission FIRST, then launch ──
  const pickImage = async () => {
    if (!canUploadReport()) return setShowPaywall(true);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Gallery Permission Required',
        'Please allow photo library access in your device settings to pick a report image.',
        [{ text: 'OK' }]
      );
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      const name = a.fileName ?? 'report.jpg';
      if (!validatePickedFile(name)) return;
      setFile({ uri: a.uri, name, mimeType: a.mimeType ?? 'image/jpeg', size: (a as any).fileSize });
    }
  };

  // ── Document picker — no extra permission needed on modern Android/iOS ──
  const pickDoc = async () => {
    if (!canUploadReport()) return setShowPaywall(true);
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      if (!validatePickedFile(a.name)) return;
      setFile({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/pdf', size: a.size, lastModified: (a as any).lastModified });
    }
  };

  // Step 1: show AI analysis consent modal
  const handleSendPress = () => {
    if (!canUploadReport()) return setShowPaywall(true);
    if (!file) return;
    setShowPermModal(true);
  };

  // Step 2: user confirmed — run analysis
  const handleConfirmedAnalysis = async () => {
    if (!file) return;
    // ── Double-submit guard ─────────────────────────────────────────────
    // analyzeInFlight is a ref, checked synchronously, BEFORE any state
    // update or await. This is what actually stops two taps (e.g. a fast
    // double-tap on the modal's confirm button, or a touch event firing
    // twice) from both reaching reportsApi.analyze() and sending two real
    // POST /api/analyze-report requests for the same file. One request
    // then succeeds and saves the report (explaining why it shows up in
    // the list), while the other has nothing left to "win" the response
    // race and just sits there until the client-side timeout fires —
    // which is the exact symptom that was being investigated here.
    if (analyzeInFlight.current) {
      console.log('[upload] ⚠️ handleConfirmedAnalysis called again while already in flight — ignoring duplicate tap');
      return;
    }
    analyzeInFlight.current = true;
    cancelControllerRef.current = new AbortController();
    setIsAnalyzing(true);
    setShowPermModal(false);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as any);
      if (memberId) {
        formData.append('member_id', memberId);
      }
      
      // Tell the backend what kind of file this is (report vs prescription)
      // so it can trigger the right AI extraction prompt.
      formData.append('document_type', context);

      console.log(
        `[upload] sending file "${file.name}" — ${file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'size unknown'}`
      );

      const result = await reportsApi.analyze(formData, file.name, {
        size: file.size,
        lastModified: file.lastModified,
        fileUri: file.uri,
      }, phone, cancelControllerRef.current.signal);

      if (result.duplicate) {
        Alert.alert(
          'Already Uploaded',
          'This report was already uploaded and analyzed previously. Showing the existing analysis.'
        );
      } else {
        await incrementReportUpload();
      }

      // ── Navigate immediately — don't block on generateReportNarrative ───────
      // generateReportNarrative is a secondary AI call that was blocking
      // navigation. If it's slow or fails the user never sees the result even
      // though the report was fully analyzed. Navigate first, fire narrative
      // generation in the background (non-blocking).
      if (context === 'prescription') {
        router.push({
          pathname: '/medicines/prescription-review',
          params: {
            detectedMedicines: JSON.stringify(result.detectedMedicines),
          },
        });
      } else {
        router.push({
          pathname: '/analysis',
          params: {
            reportId: String(result.reportId),
            patientName: result.patientName,
            hospitalName: result.hospitalName,
            summary: result.summary,
            values: JSON.stringify(result.values),
            detectedMedicines: JSON.stringify(result.detectedMedicines),
            narrative: '',
          },
        });
      }

      // Background narrative generation — errors silently ignored
      try {
        let parsedSummary: any = null;
        try { parsedSummary = result.summary ? JSON.parse(result.summary) : null; } catch { }
        generateReportNarrative(
          result.reportType ?? 'Report',
          result.values?.filter((v: any) => v.status === 'high' || v.status === 'low').length ?? 0,
          parsedSummary?.health_score ?? 75,
          parsedSummary?.abnormal_findings ?? [],
        ).catch(() => { });
      } catch { }
    } catch (err: any) {
      const isCancelled = err?.message === 'Analysis cancelled';
      const isTimeout =
        !isCancelled &&
        (err?.name === 'AbortError' || /timeout|timed out|150s/i.test(err?.message ?? ''));
      const isNameMismatch = /name mismatch/i.test(err?.message ?? '') || err?.code === 'NAME_MISMATCH';

      if (isCancelled) {
        // User tapped Stop — silent exit, stay on upload screen so they can retry
        console.log('[upload] analysis cancelled by user');
      } else if (isTimeout) {
        Alert.alert(
          'Taking Longer Than Expected',
          'The server is still processing your report. It may appear in your reports list in a moment — please check there.',
          [
            {
              text: 'Go to Reports',
              onPress: () => router.replace('/(tabs)/reports'),
            },
            { text: 'Stay Here', style: 'cancel' },
          ]
        );
      } else if (isNameMismatch) {
        Alert.alert(
          'Name Mismatch',
          'Your name and the report name are not matching. Analysis cannot proceed for security reasons.'
        );
      } else {
        Alert.alert('Analysis Failed', err.message);
      }
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
      analyzeInFlight.current = false;
      cancelControllerRef.current = null;
      setLoading(false);
      setIsAnalyzing(false);
      analyzeInFlight.current = false;
    }
  };

  return (
    <View style={styles.c}>
      <Stack.Screen options={{ title: context === 'prescription' ? 'Upload Prescription' : t('upload_report') }} />
      {/* Analyzing overlay */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.overlayTitle}>Analyzing Report</Text>
            <Text style={styles.overlaySub}>
              {elapsedSec < 15
                ? 'AI is reading your report…\nThis usually takes 30–60 seconds.'
                : elapsedSec < 45
                  ? `Extracting lab values… (${elapsedSec}s)\nAI is identifying health parameters.`
                  : elapsedSec < 90
                    ? `Generating health insights… (${elapsedSec}s)\nAlmost there, please wait.`
                    : `Still processing… (${elapsedSec}s)\nComplex reports can take up to 2 minutes.`}
            </Text>
            {elapsedSec >= 10 && (
              <Pressable
                style={styles.overlayStopBtn}
                onPress={() => {
                  cancelControllerRef.current?.abort();
                  setLoading(false);
                  setIsAnalyzing(false);
                  analyzeInFlight.current = false;
                  cancelControllerRef.current = null;
                }}
              >
                <Ionicons name="stop-circle-outline" size={18} color={Colors.danger} />
                <Text style={styles.overlayStopText}>Stop Analysis</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* AI analysis consent modal */}
      <AnalysisPermissionModal
        file={file}
        visible={showPermModal}
        onConfirm={handleConfirmedAnalysis}
        onCancel={() => setShowPermModal(false)}
        isSubmitting={isAnalyzing}
        context={context}
      />

      <Pressable onPress={pickDoc}>
        <Card style={styles.dropzone}>
          {file ? (
            <>
              <Ionicons name="document-text-outline" size={48} color={Colors.primary} />
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              {file.size ? <Text style={styles.fileSize}>{formatBytes(file.size)}</Text> : null}
              <Text style={styles.sub}>Tap to change</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={64} color={Colors.primary} />
              <Text style={styles.title}>{context === 'prescription' ? 'Upload Prescription' : t('upload_report')}</Text>
              <Text style={styles.sub}>(JPG, PNG, PDF | Max 10MB)</Text>
            </>
          )}
        </Card>
      </Pressable>

      <Text style={styles.or}>OR choose from</Text>

      <View style={styles.row}>
        <Pressable style={styles.opt} onPress={camera}>
          <Ionicons name="camera-outline" size={28} color={Colors.primary} />
          <Text style={styles.optLabel}>Camera</Text>
        </Pressable>
        <Pressable style={styles.opt} onPress={pickImage}>
          <Ionicons name="images-outline" size={28} color={Colors.primary} />
          <Text style={styles.optLabel}>Gallery</Text>
        </Pressable>
        <Pressable style={styles.opt} onPress={pickDoc}>
          <Ionicons name="document-outline" size={28} color={Colors.primary} />
          <Text style={styles.optLabel}>Document</Text>
        </Pressable>
      </View>

      {file && (
        <Button
          title="Send & Analyze"
          onPress={handleSendPress}
          disabled={loading}
          style={styles.sendBtn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, padding: 16, backgroundColor: Colors.bg, gap: 16 },
  dropzone: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, borderStyle: 'dashed', gap: 8 },
  title: { fontSize: 16, fontWeight: '600', color: Colors.text },
  fileName: { fontSize: 15, fontWeight: '600', color: Colors.text, maxWidth: '80%' },
  fileSize: { fontSize: 12, color: Colors.textMuted },
  sub: { color: Colors.textMuted, fontSize: 12 },
  or: { textAlign: 'center', color: Colors.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  opt: { flex: 1, alignItems: 'center', padding: 16, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, gap: 6, backgroundColor: Colors.surface },
  optLabel: { fontSize: 12, color: Colors.text, textAlign: 'center' },
  sendBtn: { borderRadius: Radius.lg, paddingVertical: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  overlayCard: { backgroundColor: '#fff', borderRadius: Radius.xl, padding: 32, alignItems: 'center', gap: 12, marginHorizontal: 32 },
  overlayTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  overlaySub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  overlayStopBtn: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 20, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.danger, backgroundColor: '#FEF2F2' },
  overlayStopText: { fontSize: 14, color: Colors.danger, fontWeight: '700' },
});

const perm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14, paddingBottom: 36 },
  iconWrap: { alignSelf: 'center', width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  sub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 21 },
  fileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 12 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  fileMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  bullets: { gap: 8 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20 },
  confirmBtn: { backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: Colors.textMuted, fontSize: 15, fontWeight: '500' },
});