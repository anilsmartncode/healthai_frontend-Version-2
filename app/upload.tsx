/**
 * app/upload.tsx  — Upload Screen
 *
 * Changes:
 *  - Privacy/permission modal shown before analysis starts
 *  - User must explicitly consent before sending the file to AI
 *  - File info (name, size, type) shown in the consent dialog
 *  - "Analyzing…" overlay while processing
 */

import {
  View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Radius } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';
import { reportsApi } from '@/services/reportsApi';
import { generateReportNarrative } from '@/services/aiService';

type PickedFile = { uri: string; name: string; mimeType: string; size?: number };

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Permission modal shown before analysis ────────────────────────────────────
function AnalysisPermissionModal({
  file,
  visible,
  onConfirm,
  onCancel,
}: {
  file: PickedFile | null;
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={perm.overlay}>
        <View style={perm.sheet}>
          {/* Icon */}
          <View style={perm.iconWrap}>
            <Ionicons name="shield-checkmark-outline" size={36} color={Colors.primary} />
          </View>

          <Text style={perm.title}>Allow AI Analysis?</Text>
          <Text style={perm.sub}>
            Your report will be securely sent to our AI to extract lab values and
            generate health insights. It is never shared with third parties.
          </Text>

          {/* File info */}
          {file && (
            <View style={perm.fileCard}>
              <Ionicons
                name={file.mimeType?.includes('pdf') ? 'document-text-outline' : 'image-outline'}
                size={22}
                color={Colors.primary}
              />
              <View style={perm.fileInfo}>
                <Text style={perm.fileName} numberOfLines={1}>{file.name}</Text>
                {file.size ? (
                  <Text style={perm.fileMeta}>{formatBytes(file.size)}</Text>
                ) : null}
              </View>
            </View>
          )}

          {/* Data-use bullet points */}
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

          {/* Buttons */}
          <Pressable style={perm.confirmBtn} onPress={onConfirm}>
            <Text style={perm.confirmText}>Yes, Analyze Report</Text>
          </Pressable>
          <Pressable style={perm.cancelBtn} onPress={onCancel}>
            <Text style={perm.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── Main upload screen ────────────────────────────────────────────────────────
export default function Upload() {
  const { t } = useLang();
  const [file, setFile]             = useState<PickedFile | null>(null);
  const [loading, setLoading]       = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);

  const pickDoc = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      setFile({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/pdf', size: a.size });
    }
  };

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      setFile({ uri: a.uri, name: a.fileName ?? 'report.jpg', mimeType: a.mimeType ?? 'image/jpeg' });
    }
  };

  const camera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const r = await ImagePicker.launchCameraAsync();
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      setFile({ uri: a.uri, name: a.fileName ?? 'photo.jpg', mimeType: a.mimeType ?? 'image/jpeg' });
    }
  };

  // Step 1: show permission modal
  const handleSendPress = () => {
    if (!file) return;
    setShowPermModal(true);
  };

  // Step 2: user confirmed — actually analyze
  const handleConfirmedAnalysis = async () => {
    if (!file) return;
    setShowPermModal(false);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as any);

      const result = await reportsApi.analyze(formData, file.name);

      // Generate plain-English narrative (shown above tab bar on analysis screen)
      let parsedSummary: any = null;
      try { parsedSummary = result.summary ? JSON.parse(result.summary) : null; } catch {}
      const narrative = await generateReportNarrative(
        result.reportType ?? 'Report',
        result.values?.filter((v: any) => v.status === 'high' || v.status === 'low').length ?? 0,
        parsedSummary?.health_score ?? 75,
        parsedSummary?.abnormal_findings ?? [],
      );

      router.push({
        pathname: '/analysis',
        params: {
          reportId:         String(result.reportId),
          patientName:      result.patientName,
          hospitalName:     result.hospitalName,
          summary:          result.summary,
          values:           JSON.stringify(result.values),
          detectedMedicines: JSON.stringify(result.detectedMedicines),
          narrative,
        },
      });
    } catch (err: any) {
      Alert.alert('Analysis Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.c}>
      {/* Analyzing overlay */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.overlayTitle}>Analyzing Report</Text>
            <Text style={styles.overlaySub}>AI is reading your report…{'\n'}This usually takes a few seconds.</Text>
          </View>
        </View>
      </Modal>

      {/* Permission modal */}
      <AnalysisPermissionModal
        file={file}
        visible={showPermModal}
        onConfirm={handleConfirmedAnalysis}
        onCancel={() => setShowPermModal(false)}
      />

      <Pressable onPress={pickDoc}>
        <Card style={styles.dropzone}>
          {file ? (
            <>
              <Ionicons name="document-text-outline" size={48} color={Colors.primary} />
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              {file.size ? (
                <Text style={styles.fileSize}>{formatBytes(file.size)}</Text>
              ) : null}
              <Text style={styles.sub}>Tap to change</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={64} color={Colors.primary} />
              <Text style={styles.title}>{t('upload_report')}</Text>
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
  c:            { flex: 1, padding: 16, backgroundColor: Colors.bg, gap: 16 },
  dropzone:     { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, borderStyle: 'dashed', gap: 8 },
  title:        { fontSize: 16, fontWeight: '600', color: Colors.text },
  fileName:     { fontSize: 15, fontWeight: '600', color: Colors.text, maxWidth: '80%' },
  fileSize:     { fontSize: 12, color: Colors.textMuted },
  sub:          { color: Colors.textMuted, fontSize: 12 },
  or:           { textAlign: 'center', color: Colors.textMuted },
  row:          { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  opt:          { flex: 1, alignItems: 'center', padding: 16, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, gap: 6, backgroundColor: Colors.surface },
  optLabel:     { fontSize: 12, color: Colors.text, textAlign: 'center' },
  sendBtn:      { borderRadius: Radius.lg, paddingVertical: 16 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  overlayCard:  { backgroundColor: '#fff', borderRadius: Radius.xl, padding: 32, alignItems: 'center', gap: 12, marginHorizontal: 32 },
  overlayTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  overlaySub:   { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
});

const perm = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14, paddingBottom: 36 },
  iconWrap:    { alignSelf: 'center', width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  title:       { fontSize: 20, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  sub:         { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 21 },
  fileCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.bg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: 12 },
  fileInfo:    { flex: 1 },
  fileName:    { fontSize: 14, fontWeight: '600', color: Colors.text },
  fileMeta:    { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  bullets:     { gap: 8 },
  bullet:      { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletText:  { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 20 },
  confirmBtn:  { backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn:   { alignItems: 'center', paddingVertical: 10 },
  cancelText:  { color: Colors.textMuted, fontSize: 15, fontWeight: '500' },
});
