import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const HOURS   = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const MINUTES = ['00','05','10','15','20','25','30','35','40','45','50','55'];
const PERIODS = ['AM', 'PM'];

export function CustomTimePicker({
  visible,
  initial,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  initial: string; // "08:00 AM"
  onConfirm: (t: string) => void;
  onClose: () => void;
}) {
  const parse = (t: string) => {
    const parts = t.split(/[: ]/);
    return {
      h: parts[0] ?? '08',
      m: parts[1] ?? '00',
      p: parts[2] ?? 'AM',
    };
  };
  const parsed = parse(initial);
  const [h, setH] = useState(parsed.h);
  const [m, setM] = useState(parsed.m);
  const [p, setP] = useState(parsed.p);

  // Re-sync when modal opens with a new initial value
  useEffect(() => {
    if (visible) {
      const x = parse(initial);
      setH(x.h);
      setM(x.m);
      setP(x.p);
    }
  }, [visible, initial]);

  const formatted = `${h}:${m} ${p}`;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
        <View style={ctp.header}>
          <Text style={ctp.title}>Set Custom Time</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color="#64748B" />
          </Pressable>
        </View>

        {/* Preview */}
        <View style={ctp.preview}>
          <Ionicons name="alarm-outline" size={20} color={Colors.primary} />
          <Text style={ctp.previewText}>{formatted}</Text>
        </View>

        {/* Hour */}
        <Text style={ctp.colLabel}>Hour</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ctp.row}>
          {HOURS.map((hr) => (
            <Pressable key={hr} style={[ctp.chip, h === hr && ctp.chipActive]} onPress={() => setH(hr)}>
              <Text style={[ctp.chipText, h === hr && ctp.chipTextActive]}>{hr}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Minute */}
        <Text style={ctp.colLabel}>Minute</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ctp.row}>
          {MINUTES.map((mn) => (
            <Pressable key={mn} style={[ctp.chip, m === mn && ctp.chipActive]} onPress={() => setM(mn)}>
              <Text style={[ctp.chipText, m === mn && ctp.chipTextActive]}>{mn}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* AM / PM */}
        <Text style={ctp.colLabel}>Period</Text>
        <View style={ctp.periodRow}>
          {PERIODS.map((pd) => (
            <Pressable key={pd} style={[ctp.periodBtn, p === pd && ctp.periodBtnActive]} onPress={() => setP(pd)}>
              <Text style={[ctp.periodText, p === pd && ctp.periodTextActive]}>{pd}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={ctp.confirm} onPress={() => { onConfirm(formatted); onClose(); }}>
          <Text style={ctp.confirmText}>Confirm — {formatted}</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const ctp = StyleSheet.create({
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  title:           { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  preview:         { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, backgroundColor: Colors.primary + '10', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.primary + '30' },
  previewText:     { fontSize: 22, fontWeight: '800', color: Colors.primary },
  colLabel:        { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: 16, marginTop: 16, marginBottom: 6 },
  row:             { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  chip:            { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  chipActive:      { backgroundColor: Colors.primary + '12', borderColor: Colors.primary },
  chipText:        { fontSize: 15, fontWeight: '600', color: '#64748B' },
  chipTextActive:  { color: Colors.primary, fontWeight: '800' },
  periodRow:       { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  periodBtn:       { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  periodBtnActive: { backgroundColor: Colors.primary + '12', borderColor: Colors.primary },
  periodText:      { fontSize: 16, fontWeight: '600', color: '#64748B' },
  periodTextActive:{ color: Colors.primary, fontWeight: '800' },
  confirm:         { margin: 16, marginTop: 24, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  confirmText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
});
