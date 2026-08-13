/**
 * app/upload.tsx  — Upload Screen (Invisible Analyzer)
 *
 * This screen now purely serves as a transparent modal that displays the 
 * "Analyzing Report" progress state. It receives a file and/or text from 
 * ChatInputBar and immediately fires off the analysis API.
 */

import {
  View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, Modal
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

      const result = await reportsApi.analyze(formData, targetFile.name, {
        size: targetFile.size,
        lastModified: targetFile.lastModified,
        fileUri: targetFile.uri,
      }, phone, cancelControllerRef.current.signal);

      const hasData = context === 'prescription'
        ? (result.detectedMedicines && result.detectedMedicines.length > 0)
        : (result.values && result.values.length > 0);

      if (!hasData) throw new Error('Please provide clear report text or document');

      if (result.duplicate) {
        Alert.alert('Already Uploaded', 'This report was already uploaded and analyzed previously. Showing the existing analysis.');
      } else {
        await incrementReportUpload();
      }

      if (context === 'prescription') {
        router.replace({ pathname: '/medicines/prescription-review', params: { detectedMedicines: JSON.stringify(result.detectedMedicines) } });
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
