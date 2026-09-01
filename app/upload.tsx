/**
 * app/upload.tsx  — Upload Screen (Invisible Analyzer)
 *
 * This screen now purely serves as a transparent modal that displays the 
 * "Analyzing Report" progress state. It receives a file and/or text from 
 * ChatInputBar and immediately fires off the analysis API.
 */

import {
  View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Modal, ScrollView, Linking,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import * as Print from 'expo-print';

import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useUsage } from '@/context/UsageContext';
import { reportsApi } from '@/services/reportsApi';
import { generateReportNarrative } from '@/services/aiService';

type PickedFile = { uri: string; name: string; mimeType: string; size?: number; lastModified?: number; isPasted?: boolean };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isUsableValue(v: any): boolean {
  if (!v || !v.value) return false;
  const val = String(v.value).trim().toLowerCase();
  if (val === '') return false;
  const dummyValues = ['n/a', 'na', 'none', 'null', 'nil', '-', '--', 'not detected', 'not seen', 'absent', 'negative', 'normal'];
  return !dummyValues.includes(val);
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
    const isRx = context === 'prescription';
    const dataLabel = isRx ? 'prescription' : 'report';

    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={perm.overlay}>
          <View style={perm.sheet}>
            <Pressable style={perm.closeBtn} onPress={onCancel} hitSlop={12}>
              <Ionicons name="close" size={20} color="#6b8f8f" />
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={perm.scrollContent}>

              {/* Header */}
              <View style={perm.headerRow}>
                <View style={perm.mainIconBox}>
                  <Ionicons name="shield-checkmark" size={28} color="#fff" />
                </View>
                <Text style={perm.title}>AI Processing & Data Sharing Consent</Text>
              </View>

              <Text style={perm.subtitle}>
                HealthAI uses AI to analyze information you provide and generate health summaries, explanations, insights and recommendations.{'\n\n'}
                Some AI features require selected information to be securely sent to third-party AI service providers.{'\n'}
                <Text style={perm.boldGreen}>We need your explicit permission before we do that.</Text>
              </Text>

              {/* ── File being sent ── */}
              {file && (
                <View style={perm.fileCard}>
                  <Ionicons
                    name={file.mimeType?.includes('pdf') ? 'document-text-outline' : 'image-outline'}
                    size={20}
                    color="#156C60"
                  />
                  <View style={perm.fileInfo}>
                    <Text style={perm.fileName} numberOfLines={1}>{file.name}</Text>
                    {file.size ? <Text style={perm.fileMeta}>{formatBytes(file.size)}</Text> : null}
                  </View>
                </View>
              )}

              {/* Section 1: What info */}
              <View style={perm.sectionHeader}>
                <Ionicons name="cube-outline" size={18} color="#156C60" />
                <Text style={perm.sectionTitle}>What information may be sent?</Text>
              </View>

              {[
                {
                  icon: isRx ? 'medkit-outline' : 'document-text-outline' as const,
                  title: isRx ? 'Prescription Image' : 'Medical Report',
                  detail: isRx ? 'The file you selected to extract medicines and instructions.' : 'The file you selected to extract and analyze lab values.',
                },
                {
                  icon: 'person-outline' as const,
                  title: 'Age & Gender',
                  detail: 'Crucial for accurate analysis, as normal health ranges and insights vary significantly based on your age and biological gender.',
                },
              ].map((item, i) => (
                <View key={i} style={perm.dataRow}>
                  <View style={perm.dataIconWrap}>
                    <Ionicons name={item.icon as any} size={20} color="#3E8D82" />
                  </View>
                  <View style={perm.dataTextWrap}>
                    <Text style={perm.dataTitle}>{item.title}</Text>
                    <Text style={perm.dataDetail}>{item.detail}</Text>
                  </View>
                </View>
              ))}

              <View style={perm.twoColWrap}>
                <View style={perm.twoColBox}>
                  <Text style={perm.twoColTitle}>Why is it sent?</Text>
                  <Text style={perm.twoColBody}>To analyze, summarize, explain medical information, interpret measurements and provide requested insights and recommendations.</Text>
                </View>
                <View style={perm.twoColDivider} />
                <View style={perm.twoColBox}>
                  <Text style={perm.twoColTitle}>We use only what's necessary</Text>
                  <Text style={perm.twoColBody}>We <Text style={{ fontWeight: '700' }}>send</Text> only the information required for the AI feature you request.</Text>
                </View>
              </View>

              {/* Section 2: Who receives */}
              <View style={[perm.sectionHeader, { marginTop: 24 }]}>
                <Ionicons name="shield-half-outline" size={18} color="#156C60" />
                <Text style={perm.sectionTitle}>Who receives your information?</Text>
              </View>

              <View style={perm.providerRow}>
                <View style={perm.providerIconWrap}>
                  <Ionicons name="document-text-outline" size={18} color="#3E8D82" />
                </View>
                <View style={perm.providerTextWrap}>
                  <Text style={perm.providerName}>HealthAI / SMARTnCODE Technologies</Text>
                  <Text style={perm.providerDesc}>Operates the app and coordinates the AI processing.</Text>
                </View>
              </View>

              <View style={[perm.providerRow, { marginTop: 12 }]}>
                <View style={perm.providerIconWrap}>
                  <Ionicons name="sparkles-outline" size={18} color="#3E8D82" />
                </View>
                <View style={perm.providerTextWrap}>
                  <Text style={perm.providerName}>Google Cloud, OpenAI, Anthropic (Multimodal)</Text>
                  <Text style={perm.providerDesc}>Selected information may be securely transmitted to our trusted multimodal AI providers (e.g., Google Cloud, OpenAI, Anthropic) to generate the AI response.</Text>
                  <Pressable onPress={() => Linking.openURL('https://policies.google.com/privacy')} style={perm.providerLink}>
                    <Text style={perm.providerLinkText}>AI Provider Details</Text>
                    <Ionicons name="chevron-forward" size={12} color="#156C60" />
                  </Pressable>
                </View>
              </View>

              {/* Section 3: Training */}
              <View style={perm.trainingCard}>
                <View style={perm.trainingHeaderRow}>
                  <Ionicons name="pie-chart-outline" size={16} color="#156C60" />
                  <Text style={perm.trainingTitle}>AI model training</Text>
                </View>
                <Text style={perm.trainingBody}>
                  Your personal health information is <Text style={{ fontWeight: '700', color: '#1a2e35' }}>not</Text> used to train or improve third-party general-purpose AI models.
                </Text>
              </View>

              {/* Badges */}
              <View style={perm.badgeRow}>
                <View style={perm.badge}>
                  <Ionicons name="lock-closed" size={18} color="#156C60" />
                  <Text style={perm.badgeText}>Encrypted{'\n'}in transit & at rest</Text>
                </View>
                <View style={perm.badge}>
                  <Ionicons name="person-outline" size={18} color="#156C60" />
                  <Text style={perm.badgeText}>Access{'\n'}controls</Text>
                </View>
                <View style={perm.badge}>
                  <Ionicons name="hardware-chip-outline" size={18} color="#156C60" />
                  <Text style={perm.badgeText}>Secure AI{'\n'}processing</Text>
                </View>
              </View>

              {/* Withdraw Notice */}
              <View style={perm.withdrawBox}>
                <Text style={perm.withdrawText}>
                  You can withdraw AI-processing consent anytime from{'\n'}
                  <Text style={{ fontWeight: '700', color: '#1a2e35' }}>Settings → Privacy → AI Processing</Text>
                </Text>
              </View>

            </ScrollView>

            <View style={perm.actions}>
              <Pressable style={[perm.agreeBtn, isSubmitting && perm.confirmBtnDisabled]} onPress={onConfirm} disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={perm.agreeBtnText}>
                      {isRx ? 'I Agree — Analyze Prescription' : 'I Agree — Analyze Report'}
                    </Text>
                  </>
                )}
              </Pressable>
              <Pressable style={perm.declineBtn} onPress={onCancel}>
                <Text style={perm.declineBtnText}>Cancel Analysis</Text>
              </Pressable>
              <Text style={perm.footerText}>You can change your choice later in Privacy Settings.</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Convert raw pasted text into a formatted PDF document on device ───────────
  async function createPdfFromText(text: string, context?: string): Promise<PickedFile> {
    const safeText = String(text)
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

    try {
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
    } catch (err: any) {
      console.error("PDF Generation failed:", err);
      throw new Error(`PDF Generation failed: ${err.message}`);
    }
  }


  // ── Main upload screen ─────────────────────────────────────────────────────
  export default function Upload() {
    const { phone } = useAuth();
    const { incrementReportUpload, setShowPaywall } = useUsage();
    const { memberId, context, fileUri, fileName, mimeType, prefillText } = useLocalSearchParams<any>();

    const [loading, setLoading] = useState(true);
    const [elapsedSec, setElapsedSec] = useState(0);

    const analyzeInFlight = useRef(false);
    const cancelControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
      const interval = setInterval(() => setElapsedSec(s => s + 1), 1000);
      return () => clearInterval(interval);
    }, []);

    const handleConfirmedAnalysis = async (targetFile: PickedFile) => {
      if (analyzeInFlight.current) return;
      analyzeInFlight.current = true;
      cancelControllerRef.current = new AbortController();

      try {
        const formData = new FormData();
        formData.append('file', { uri: targetFile.uri, name: targetFile.name, type: targetFile.mimeType } as any);
        if (memberId) formData.append('member_id', memberId);
        if (context) formData.append('document_type', context);
        if (prefillText && String(prefillText).trim()) {
          formData.append('user_query', String(prefillText).trim());
        }

        const result = await reportsApi.analyze(formData, targetFile.name, {
          size: targetFile.size,
          lastModified: targetFile.lastModified,
          fileUri: targetFile.uri,
        }, phone, cancelControllerRef.current.signal);

        const usableValues = (result.values || []).filter(isUsableValue);

        let finalMedicines = result.detectedMedicines || [];

        // NEW SPEC: Prescriptions have their medicines inside result.prescription.medicines
        if (context === 'prescription' && result.prescription?.medicines) {
          finalMedicines = result.prescription.medicines.map((m: any) => ({
            name: m.name || m.medicine_name || '',
            dosage: m.dosage || '',
            reason: m.why_prescribed || m.usage_explanation || m.instructions || '',
            type: 'mentioned',
            frequency: m.frequency,
            duration: m.duration,
            instructions: m.instructions,
          }));
        }

        // If backend parsed the prescription as a generic lab report, medicines might be inside usableValues
        if (context === 'prescription' && finalMedicines.length === 0 && usableValues.length > 0) {
          finalMedicines = usableValues.map((v: any) => ({
            name: v.name,
            dosage: v.value || '',
            reason: v.simpleMeaning || '',
            type: 'mentioned'
          }));
        }

        const hasData = context === 'prescription'
          ? (finalMedicines.length > 0)
          : (usableValues.length > 0);

        if (!hasData) {
          if (context === 'prescription') {
            throw new Error('We couldn\'t analyze this prescription. The provided document did not contain any readable medicines.');
          }
          throw new Error('We couldn\'t analyze this report. The provided text or document did not contain any readable medical lab values.');
        }

        if (result.duplicate) {
          Alert.alert('Already Uploaded', 'This report was already uploaded and analyzed previously. Showing the existing analysis.');
        } else {
          await incrementReportUpload();
        }

        if (context === 'prescription' || result.reportType?.toUpperCase() === 'PRESCRIPTION') {
          router.replace({ pathname: '/prescription/[id]', params: { id: String(result.reportId) } });
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
              userQuestionAnswer: result.userQuestionAnswer
                ? JSON.stringify(result.userQuestionAnswer)
                : (prefillText ? JSON.stringify({ question: prefillText, answer: '' }) : undefined),
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
        const isTimeout = !isCancelled && (err?.name === 'AbortError' || /timeout|timed out|150s/i.test(err?.message ?? ''));
        const isNameMismatch = /name mismatch/i.test(err?.message ?? '') || err?.code === 'NAME_MISMATCH';

        if (isCancelled) {
          router.back();
        } else if (isTimeout) {
          Alert.alert('Taking Longer Than Expected', 'The server is still processing your report.', [
            { text: 'Go to Reports', onPress: () => router.replace('/(tabs)/reports') },
            { text: 'Stay Here', style: 'cancel' },
          ]);
          router.back();
        } else if (isNameMismatch) {
          Alert.alert('Name Mismatch', 'Your name and the report name are not matching.');
          router.back();
        } else {
          Alert.alert('Analysis Failed', err.message);
          router.back();
        }
      } finally {
        setLoading(false);
        analyzeInFlight.current = false;
        cancelControllerRef.current = null;
      }
    };

    useEffect(() => {
      if (analyzeInFlight.current) return;

      if (fileUri) {
        handleConfirmedAnalysis({ uri: fileUri, name: fileName || 'Document', mimeType: mimeType || 'application/pdf' });
      } else if (prefillText) {
        (async () => {
          try {
            const generatedPdf = await createPdfFromText(prefillText, context);
            handleConfirmedAnalysis(generatedPdf);
          } catch (err: any) {
            Alert.alert("Analysis Failed", err.message);
            router.back();
          }
        })();
      } else {
        router.back();
      }
    }, [fileUri, prefillText]);

    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false, presentation: 'transparentModal', animation: 'none' }} />

        <Modal visible={loading} transparent animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.overlayCard}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.overlayTitle}>Analyzing Report</Text>
              <Text style={styles.overlaySub}>
                {elapsedSec < 15
                  ? 'AI is reading your report...\nThis usually takes 30–60 seconds.'
                  : elapsedSec < 45
                    ? `Extracting lab values... (${elapsedSec}s)\nAI is identifying health parameters.`
                    : `Still processing... (${elapsedSec}s)\nComplex reports can take up to 2 minutes.`}
              </Text>
              {elapsedSec >= 10 && (
                <Pressable
                  style={styles.overlayStopBtn}
                  onPress={() => {
                    cancelControllerRef.current?.abort();
                    router.back();
                  }}
                >
                  <Ionicons name="stop-circle-outline" size={18} color={Colors.danger} />
                  <Text style={styles.overlayStopText}>Stop Analysis</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    overlayCard: {
      backgroundColor: '#fff',
      borderRadius: Radius.xl,
      padding: 24,
      width: '100%',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 10,
    },
    overlayTitle: {
      marginTop: 16,
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text,
    },
    overlaySub: {
      marginTop: 8,
      fontSize: 14,
      color: Colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    overlayStopBtn: {
      marginTop: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 99,
      backgroundColor: '#FEF2F2',
    },
    overlayStopText: {
      color: Colors.danger,
      fontSize: 14,
    },
  });

  const perm = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '95%', paddingBottom: 24 },
    closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0F4F4', justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 16 },

    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16, paddingRight: 20 },
    mainIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#156C60', justifyContent: 'center', alignItems: 'center' },
    title: { flex: 1, fontSize: 18, fontWeight: '800', color: '#112228', lineHeight: 24 },
    subtitle: { fontSize: 12.5, color: '#4A6262', lineHeight: 19, marginBottom: 24 },
    boldGreen: { fontWeight: '700', color: '#156C60' },

    // File card specific to upload.tsx
    fileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: '#F0F5F5' },
    fileInfo: { flex: 1 },
    fileName: { fontSize: 14, fontWeight: '700', color: '#112228' },
    fileMeta: { fontSize: 11.5, color: '#8BA8A8', marginTop: 3 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: '#112228' },

    dataRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
    dataIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F2F7F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5EFEF' },
    dataTextWrap: { flex: 1 },
    dataTitle: { fontSize: 13, fontWeight: '700', color: '#112228', marginBottom: 2 },
    dataDetail: { fontSize: 11.5, color: '#6A8A8A' },

    twoColWrap: { flexDirection: 'row', backgroundColor: '#F2F7F6', borderRadius: 12, padding: 16, marginTop: 8 },
    twoColBox: { flex: 1, paddingHorizontal: 4 },
    twoColDivider: { width: 1, backgroundColor: '#DCEBEA', marginHorizontal: 12 },
    twoColTitle: { fontSize: 12, fontWeight: '700', color: '#112228', marginBottom: 6 },
    twoColBody: { fontSize: 11, color: '#4A6262', lineHeight: 16 },

    providerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    providerIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F2F7F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5EFEF' },
    providerTextWrap: { flex: 1 },
    providerName: { fontSize: 13, fontWeight: '700', color: '#112228', marginBottom: 2 },
    providerDesc: { fontSize: 11.5, color: '#6A8A8A', lineHeight: 16 },
    providerLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    providerLinkText: { fontSize: 11.5, fontWeight: '700', color: '#156C60' },

    trainingCard: { marginTop: 24, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E8F0F0', backgroundColor: '#fff' },
    trainingHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    trainingTitle: { fontSize: 13, fontWeight: '700', color: '#112228' },
    trainingBody: { fontSize: 12, color: '#6A8A8A', lineHeight: 18 },

    badgeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 12 },
    badge: { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E8F0F0', paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', gap: 6 },
    badgeText: { fontSize: 10, color: '#112228', fontWeight: '600', textAlign: 'center', lineHeight: 14 },

    withdrawBox: { marginTop: 16, backgroundColor: '#F5F8F8', borderRadius: 10, padding: 14, alignItems: 'center' },
    withdrawText: { fontSize: 11.5, color: '#6A8A8A', textAlign: 'center', lineHeight: 18 },

    actions: { paddingHorizontal: 20, paddingTop: 16 },
    agreeBtn: { backgroundColor: '#156C60', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    agreeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    confirmBtnDisabled: { opacity: 0.6 },
    declineBtn: { paddingVertical: 14, alignItems: 'center' },
    declineBtnText: { color: '#156C60', fontSize: 13, fontWeight: '700' },
    footerText: { textAlign: 'center', fontSize: 10.5, color: '#8BA8A8', marginTop: 4 },
  });
