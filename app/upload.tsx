/**
 * app/upload.tsx  — Upload Screen
 *
 * Permission fix: camera / gallery / document permissions are requested
 * BEFORE the picker launches, not after.
 * Also supports:
 *   - Camera photo
 *   - Gallery picker
 *   - Document picker (PDF / DOCX)
 *   - 📋 Paste Text (Converts raw report text into PDF on-the-fly and sends to AI engine)
 * Also shows an AI-analysis consent modal before sending the file.
 */

import {
  View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Modal,
  TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';

import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Radius } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';
import { useAuth } from '@/context/AuthContext';
import { useUsage } from '@/context/UsageContext';
import { reportsApi } from '@/services/reportsApi';
import { generateReportNarrative } from '@/services/aiService';

type PickedFile = { uri: string; name: string; mimeType: string; size?: number; lastModified?: number; isPasted?: boolean };

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

// ── Convert raw pasted text into a formatted PDF document on device ───────────
async function createPdfFromText(text: string, context?: string): Promise<PickedFile> {
  const safeText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const title = context === 'prescription' ? 'Prescription Notes' : 'Clinical Medical Report';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            padding: 32px;
            color: #0F172A;
            background-color: #FFFFFF;
            line-height: 1.6;
          }
          .header {
            border-bottom: 2px solid #0284C7;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .header h1 {
            color: #0284C7;
            font-size: 22px;
            margin: 0 0 6px 0;
            font-weight: 700;
          }
          .header p {
            color: #64748B;
            font-size: 12px;
            margin: 0;
          }
          .content-box {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 20px;
          }
          pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: inherit;
            font-size: 14px;
            color: #1E293B;
            margin: 0;
            line-height: 1.6;
          }
          .footer {
            margin-top: 30px;
            font-size: 11px;
            color: #94A3B8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>HealthAI Digital Patient Record · Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>
        <div class="content-box">
          <pre>${safeText}</pre>
        </div>
        <div class="footer">
          Digitized via HealthAI Report Assistant
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  const name = context === 'prescription' ? `Prescription_${Date.now().toString().slice(-6)}.pdf` : `Pasted_Report_${Date.now().toString().slice(-6)}.pdf`;
  return {
    uri,
    name,
    mimeType: 'application/pdf',
    size: text.length * 3 + 1200,
    lastModified: Date.now(),
    isPasted: true,
  };
}

// ── Paste Report / Prescription Text Modal ───────────────────────────────────
function PasteReportModal({
  visible,
  onClose,
  onAnalyzeText,
  context,
}: {
  visible: boolean;
  onClose: () => void;
  onAnalyzeText: (text: string) => Promise<void>;
  context?: string;
}) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [justPasted, setJustPasted] = useState(false);

  const handlePasteClipboard = async () => {
    try {
      const clip = await Clipboard.getStringAsync();
      if (clip && clip.trim().length > 0) {
        setText(clip.trim());
        setJustPasted(true);
        setTimeout(() => setJustPasted(false), 2000);
      } else {
        Alert.alert('Clipboard Empty', 'No text was found on your clipboard to paste.');
      }
    } catch {
      Alert.alert('Paste Error', 'Unable to access clipboard.');
    }
  };

  const handleInsertSample = () => {
    if (context === 'prescription') {
      setText(
        'Rx Prescription Details:\n' +
        'Doctor: Dr. Rajesh Sharma, MD\n' +
        'Date: Today\n\n' +
        '1. Tab Amoxicillin 500mg - 1 tablet 3 times a day for 5 days (After food)\n' +
        '2. Tab Paracetamol 650mg - 1 tablet as needed for fever/pain\n' +
        '3. Tab Pantoprazole 40mg - 1 tablet once daily before breakfast'
      );
    } else {
      setText(
        'Patient Name: John Doe\n' +
        'Lab: Apollo Diagnostics\n' +
        'Test: Complete Blood Count (CBC) & Metabolic Panel\n\n' +
        'Hemoglobin: 13.8 g/dL (Normal Range: 13.0 - 17.0)\n' +
        'RBC Count: 4.8 million/mcL (Normal Range: 4.5 - 5.5)\n' +
        'WBC (Total Leucocyte): 7,200 /cumm (Normal Range: 4000 - 11000)\n' +
        'Platelet Count: 240,000 /cumm (Normal Range: 150000 - 450000)\n' +
        'Fasting Blood Glucose: 104 mg/dL (Normal Range: 70 - 99, Status: High)\n' +
        'HbA1c: 5.8 % (Normal Range: < 5.7, Prediabetes)\n' +
        'Total Cholesterol: 195 mg/dL (Normal Range: < 200)\n' +
        'Serum Creatinine: 0.9 mg/dL (Normal Range: 0.7 - 1.2)'
      );
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() || text.trim().length < 15) {
      Alert.alert('Text Too Short', 'Please paste or type at least a few test names and values so the AI can analyze your medical report.');
      return;
    }
    setIsProcessing(true);
    try {
      await onAnalyzeText(text.trim());
      setText('');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to prepare report text');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={pasteStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={pasteStyles.sheet}>
          {/* Header */}
          <View style={pasteStyles.header}>
            <View style={pasteStyles.iconWrap}>
              <Ionicons name="clipboard-outline" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={pasteStyles.title}>
                {context === 'prescription' ? 'Paste Prescription Text' : 'Paste Report Text'}
              </Text>
              <Text style={pasteStyles.subtitle}>
                Paste medical notes, email results, or lab report text
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={pasteStyles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </Pressable>
          </View>

          {/* Quick Helper Actions */}
          <View style={pasteStyles.quickRow}>
            <Pressable style={pasteStyles.pasteBtn} onPress={handlePasteClipboard}>
              <Ionicons
                name={justPasted ? 'checkmark-circle' : 'clipboard'}
                size={16}
                color={justPasted ? Colors.success : Colors.primary}
              />
              <Text style={[pasteStyles.pasteBtnText, justPasted && { color: Colors.success }]}>
                {justPasted ? 'Pasted!' : 'Paste from Clipboard'}
              </Text>
            </Pressable>

            <Pressable style={pasteStyles.sampleBtn} onPress={handleInsertSample}>
              <Ionicons name="sparkles-outline" size={14} color="#64748B" />
              <Text style={pasteStyles.sampleBtnText}>Insert Sample</Text>
            </Pressable>

            {text.length > 0 && (
              <Pressable style={pasteStyles.clearBtn} onPress={() => setText('')}>
                <Text style={pasteStyles.clearBtnText}>Clear</Text>
              </Pressable>
            )}
          </View>

          {/* Text Area */}
          <View style={pasteStyles.inputContainer}>
            <TextInput
              style={pasteStyles.textInput}
              multiline
              textAlignVertical="top"
              placeholder={
                context === 'prescription'
                  ? 'Paste prescription details here (e.g. Tab Amoxicillin 500mg 1-0-1 for 5 days, Paracetamol 650mg SOS...)'
                  : 'Paste your lab results, blood work values, or doctor notes here...\n\nExample:\nHemoglobin: 14.2 g/dL\nFasting Sugar: 110 mg/dL\nTotal Cholesterol: 210 mg/dL'
              }
              placeholderTextColor="#94A3B8"
              value={text}
              onChangeText={setText}
            />
            <View style={pasteStyles.counterRow}>
              <Text style={pasteStyles.counterText}>
                {text.length} characters · {text.trim() ? text.trim().split(/\s+/).length : 0} words
              </Text>
              {text.trim().length >= 15 ? (
                <View style={pasteStyles.validBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                  <Text style={pasteStyles.validText}>Ready for AI</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Submit Button */}
          <Pressable
            style={[
              pasteStyles.submitBtn,
              (text.trim().length < 15 || isProcessing) && pasteStyles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={text.trim().length < 15 || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={pasteStyles.submitBtnText}>
                  {context === 'prescription' ? 'Analyze Prescription Text' : 'Analyze Report Text'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
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
                name={file.isPasted ? 'clipboard-outline' : file.mimeType?.includes('pdf') ? 'document-text-outline' : 'image-outline'}
                size={22}
                color={Colors.primary}
              />
              <View style={perm.fileInfo}>
                <Text style={perm.fileName} numberOfLines={1}>{file.name}</Text>
                {file.isPasted ? (
                  <Text style={[perm.fileMeta, { color: Colors.primary, fontWeight: '600' }]}>Pasted Text Report</Text>
                ) : file.size ? (
                  <Text style={perm.fileMeta}>{formatBytes(file.size)}</Text>
                ) : null}
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
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeInFlight = useRef(false);
  const cancelControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!loading) {
      setElapsedSec(0);
      return;
    }
    const interval = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [loading]);

  // ── Camera ──
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

  // ── Gallery ──
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

  // ── Document picker ──
  const pickDoc = async () => {
    if (!canUploadReport()) return setShowPaywall(true);
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      if (!validatePickedFile(a.name)) return;
      setFile({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/pdf', size: a.size, lastModified: (a as any).lastModified });
    }
  };

  // ── Paste Text Handler ──
  const handleAnalyzePastedText = async (pastedText: string) => {
    if (!canUploadReport()) {
      setShowPasteModal(false);
      setShowPaywall(true);
      return;
    }
    const generatedPdf = await createPdfFromText(pastedText, context);
    setFile(generatedPdf);
    setShowPasteModal(false);
    // Directly proceed to analysis with user consent
    handleConfirmedAnalysis(generatedPdf);
  };

  // Step 1: show AI analysis consent modal
  const handleSendPress = () => {
    if (!canUploadReport()) return setShowPaywall(true);
    if (!file) return;
    setShowPermModal(true);
  };

  // Step 2: user confirmed — run analysis
  const handleConfirmedAnalysis = async (customFile?: PickedFile) => {
    const targetFile = customFile || file;
    if (!targetFile) return;

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
      formData.append('file', { uri: targetFile.uri, name: targetFile.name, type: targetFile.mimeType } as any);
      if (memberId) {
        formData.append('member_id', memberId);
      }
      if (context) {
        formData.append('document_type', context);
      }

      console.log(
        `[upload] sending file "${targetFile.name}" — ${targetFile.size ? (targetFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'size unknown'}`
      );

      const result = await reportsApi.analyze(formData, targetFile.name, {
        size: targetFile.size,
        lastModified: targetFile.lastModified,
        fileUri: targetFile.uri,
      }, phone, cancelControllerRef.current.signal);

      const hasData = context === 'prescription'
        ? (result.detectedMedicines && result.detectedMedicines.length > 0)
        : (result.values && result.values.length > 0);

      if (!hasData) {
        throw new Error('Please provide clear report text or document');
      }

      if (result.duplicate) {
        Alert.alert(
          'Already Uploaded',
          'This report was already uploaded and analyzed previously. Showing the existing analysis.'
        );
      } else {
        await incrementReportUpload();
      }

      if (context === 'prescription') {
        router.replace({
          pathname: '/medicines/prescription-review',
          params: {
            detectedMedicines: JSON.stringify(result.detectedMedicines),
          },
        });
      } else {
        router.replace({
          pathname: '/analysis',
          params: {
            reportId: String(result.reportId),
            patientName: result.patientName,
            hospitalName: result.hospitalName,
            summary: result.summary,
            values: JSON.stringify(Array.isArray(result.values) ? result.values : []),
            detectedMedicines: JSON.stringify(Array.isArray(result.detectedMedicines) ? result.detectedMedicines : []),
            narrative: '',
          },
        });
      }

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
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

      {/* Paste Report Text Modal */}
      <PasteReportModal
        visible={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        onAnalyzeText={handleAnalyzePastedText}
        context={context}
      />

      {/* AI analysis consent modal */}
      <AnalysisPermissionModal
        file={file}
        visible={showPermModal}
        onConfirm={() => handleConfirmedAnalysis()}
        onCancel={() => setShowPermModal(false)}
        isSubmitting={isAnalyzing}
        context={context}
      />

      <Pressable onPress={pickDoc}>
        <Card style={styles.dropzone}>
          {file ? (
            <>
              <View style={styles.dropzoneIconWrap}>
                <Ionicons
                  name={file.isPasted ? 'clipboard-outline' : 'document-text-outline'}
                  size={36}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              {file.isPasted ? (
                <View style={styles.pastedBadge}>
                  <Ionicons name="checkmark-circle" size={13} color={Colors.primary} />
                  <Text style={styles.pastedBadgeText}>Pasted Text Ready</Text>
                </View>
              ) : file.size ? (
                <Text style={styles.fileSize}>{formatBytes(file.size)}</Text>
              ) : null}
              <Text style={styles.sub}>Tap to change</Text>
            </>
          ) : (
            <>
              <View style={styles.dropzoneIconWrap}>
                <Ionicons name="cloud-upload-outline" size={38} color={Colors.primary} />
              </View>
              <Text style={styles.title}>{context === 'prescription' ? 'Upload Prescription' : t('upload_report')}</Text>
              <Text style={styles.sub}>JPG, PNG, PDF or Paste Text directly</Text>
            </>
          )}
        </Card>
      </Pressable>

      <Text style={styles.or}>OR choose how to input</Text>

      {/* 1/1 Full-width Action Options List (styled like QuickActions) */}
      <View style={styles.actionsList}>
        <Pressable
          style={({ pressed }) => [styles.optCard, pressed && styles.optCardPressed]}
          onPress={camera}
        >
          <View style={[styles.optIconWrap, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="camera-outline" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.optLabel}>Camera</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.optCard, pressed && styles.optCardPressed]}
          onPress={pickImage}
        >
          <View style={[styles.optIconWrap, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="images-outline" size={20} color="#D97706" />
          </View>
          <Text style={styles.optLabel}>Gallery</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.optCard, pressed && styles.optCardPressed]}
          onPress={pickDoc}
        >
          <View style={[styles.optIconWrap, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="document-outline" size={20} color="#059669" />
          </View>
          <Text style={styles.optLabel}>Document</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.optCard, styles.optCardPaste, pressed && styles.optCardPressed]}
          onPress={() => setShowPasteModal(true)}
        >
          <View style={[styles.optIconWrap, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="clipboard-outline" size={20} color="#0284C7" />
          </View>
          <Text style={[styles.optLabel, styles.optPasteLabel]}>Paste Text</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 36 },
  dropzone: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28, borderStyle: 'dashed', gap: 8, backgroundColor: '#fff', borderRadius: Radius.lg, borderWidth: 1.5, borderColor: '#CBD5E1' },
  dropzoneIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text },
  fileName: { fontSize: 15, fontWeight: '600', color: Colors.text, maxWidth: '80%' },
  fileSize: { fontSize: 12, color: Colors.textMuted },
  pastedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '15', paddingVertical: 4, paddingHorizontal: 10, borderRadius: Radius.pill },
  pastedBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  sub: { color: Colors.textMuted, fontSize: 12 },
  or: { textAlign: 'center', color: Colors.textMuted, fontSize: 13, fontWeight: '600', marginVertical: 2 },
  actionsList: { gap: 10 },
  optCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optCardPaste: {
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  optCardPressed: {
    opacity: 0.75,
  },
  optIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  optLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  optPasteLabel: {
    color: '#0284C7',
    fontWeight: '700',
  },
  sendBtn: { borderRadius: Radius.lg, paddingVertical: 16, marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  overlayCard: { backgroundColor: '#fff', borderRadius: Radius.xl, padding: 32, alignItems: 'center', gap: 12, marginHorizontal: 32 },
  overlayTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  overlaySub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  overlayStopBtn: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 20, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: Colors.danger, backgroundColor: '#FEF2F2' },
  overlayStopText: { fontSize: 14, color: Colors.danger, fontWeight: '700' },
});

const pasteStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14, maxHeight: '88%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 1 },
  closeBtn: { padding: 4 },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pasteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary + '15', paddingVertical: 8, paddingHorizontal: 12, borderRadius: Radius.pill },
  pasteBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  sampleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingVertical: 8, paddingHorizontal: 12, borderRadius: Radius.pill },
  sampleBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  clearBtn: { marginLeft: 'auto', paddingVertical: 6, paddingHorizontal: 10 },
  clearBtnText: { fontSize: 12, fontWeight: '600', color: '#DC2626' },
  inputContainer: { backgroundColor: '#F8FAFC', borderRadius: Radius.md, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, gap: 8 },
  textInput: { minHeight: 160, maxHeight: 240, fontSize: 13.5, color: '#0F172A', lineHeight: 20 },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8 },
  counterText: { fontSize: 11, color: '#94A3B8' },
  validBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  validText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  submitBtn: { flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
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
