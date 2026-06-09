import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Colors, Radius, Spacing } from '@/constants/Colors';

export interface ScanResult {
  id: string;
  name: string;
  genericName?: string;
  manufacturer?: string;
  batchNo?: string;
  expiryDate?: string;
  dosageForm?: string;
  strength?: string;
  imageUri?: string;  // local URI of the scanned image
  scannedAt: string;  // ISO date string
  confidence: number; // 0–1
  warnings?: string[];
}

interface Props {
  result?: ScanResult | null;
  onScanPress: () => void;
  onAddToReminders?: (result: ScanResult) => void;
  onCheckInteractions?: (result: ScanResult) => void;
}

function ConfidencePill({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? Colors.success : pct >= 60 ? Colors.warning : Colors.danger;
  return (
    <View style={[styles.confidencePill, { backgroundColor: color + '18' }]}>
      <View style={[styles.confidenceDot, { backgroundColor: color }]} />
      <Text style={[styles.confidenceText, { color }]}>{pct}% match</Text>
    </View>
  );
}

export function MedicineScannerCard({ result, onScanPress, onAddToReminders, onCheckInteractions }: Props) {
  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="scan-outline" size={20} color={Colors.primary} />
          <Text style={styles.headerTitle}>Medicine Scanner</Text>
        </View>
        <Pressable style={styles.scanBtn} onPress={onScanPress}>
          <Ionicons name="camera-outline" size={16} color="#fff" />
          <Text style={styles.scanBtnText}>{result ? 'Rescan' : 'Scan'}</Text>
        </Pressable>
      </View>

      {!result ? (
        /* Empty state */
        <Pressable style={styles.emptyArea} onPress={onScanPress}>
          <View style={styles.scanRing}>
            <Ionicons name="camera-outline" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Scan a Medicine</Text>
          <Text style={styles.emptyHint}>
            Point your camera at the medicine box or label to identify it instantly
          </Text>
        </Pressable>
      ) : (
        /* Result */
        <View style={styles.result}>
          {result.imageUri && (
            <Image source={{ uri: result.imageUri }} style={styles.resultImage} resizeMode="cover" />
          )}

          <View style={styles.resultInfo}>
            <View style={styles.resultTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.medName}>{result.name}</Text>
                {result.genericName && (
                  <Text style={styles.genericName}>{result.genericName}</Text>
                )}
              </View>
              <ConfidencePill value={result.confidence} />
            </View>

            {/* Detail grid */}
            <View style={styles.grid}>
              {result.strength && <DetailItem label="Strength" value={result.strength} icon="flask-outline" />}
              {result.dosageForm && <DetailItem label="Form" value={result.dosageForm} icon="bandage-outline" />}
              {result.manufacturer && <DetailItem label="Manufacturer" value={result.manufacturer} icon="business-outline" />}
              {result.expiryDate && <DetailItem label="Expiry" value={result.expiryDate} icon="calendar-outline" />}
              {result.batchNo && <DetailItem label="Batch No." value={result.batchNo} icon="barcode-outline" />}
            </View>

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <View style={styles.warningsBox}>
                {result.warnings.map((w, i) => (
                  <View key={i} style={styles.warningRow}>
                    <Ionicons name="warning-outline" size={14} color={Colors.warning} />
                    <Text style={styles.warningText}>{w}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Actions */}
            <View style={styles.resultActions}>
              {onAddToReminders && (
                <Pressable style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={() => onAddToReminders(result)}>
                  <Ionicons name="alarm-outline" size={15} color="#fff" />
                  <Text style={styles.actionBtnText}>Add Reminder</Text>
                </Pressable>
              )}
              {onCheckInteractions && (
                <Pressable style={[styles.actionBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]} onPress={() => onCheckInteractions(result)}>
                  <Ionicons name="git-compare-outline" size={15} color={Colors.primary} />
                  <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Check Interactions</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      )}
    </Card>
  );
}

function DetailItem({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.detailItem}>
      <Ionicons name={icon as any} size={13} color={Colors.textMuted} />
      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:             { padding: Spacing.md, gap: Spacing.md },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle:      { fontSize: 15, fontWeight: '700', color: Colors.text },
  scanBtn:          { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
  scanBtnText:      { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyArea:        { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  scanRing:         { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary + '0A' },
  emptyTitle:       { fontSize: 16, fontWeight: '600', color: Colors.text },
  emptyHint:        { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
  result:           { gap: Spacing.md },
  resultImage:      { width: '100%', height: 140, borderRadius: Radius.md, backgroundColor: Colors.surface },
  resultInfo:       { gap: Spacing.sm },
  resultTop:        { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  medName:          { fontSize: 17, fontWeight: '700', color: Colors.text },
  genericName:      { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  confidencePill:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: Radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  confidenceDot:    { width: 6, height: 6, borderRadius: 3 },
  confidenceText:   { fontSize: 12, fontWeight: '600' },
  grid:             { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  detailItem:       { flexDirection: 'row', alignItems: 'flex-start', gap: 5, width: '47%' },
  detailLabel:      { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  detailValue:      { fontSize: 13, fontWeight: '600', color: Colors.text },
  warningsBox:      { backgroundColor: Colors.warning + '12', borderRadius: Radius.md, padding: Spacing.sm, gap: 5 },
  warningRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  warningText:      { fontSize: 12, color: Colors.text, flex: 1, lineHeight: 17 },
  resultActions:    { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  actionBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.md },
  actionBtnText:    { fontSize: 13, fontWeight: '600', color: '#fff' },
});
