/**
 * DatePickerField.tsx
 * ─────────────────────────────────────────────────────────────────────
 * A reusable tappable field that opens the native date picker.
 * Uses @react-native-community/datetimepicker (bundled with Expo).
 *
 * Install (once, in project root):
 *   npx expo install @react-native-community/datetimepicker
 * ─────────────────────────────────────────────────────────────────────
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';

interface Props {
  label?: string;
  value: Date | null;
  onChange: (date: Date) => void;
  /** Oldest date selectable. Defaults to 100 years ago. */
  minimumDate?: Date;
  /** Latest date selectable. Defaults to today. */
  maximumDate?: Date;
}

function formatDate(d: Date): string {
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd} / ${mm} / ${yyyy}`;
}

export function DatePickerField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: Props) {
  const [open, setOpen] = useState(false);

  const today      = new Date();
  const minDate    = minimumDate ?? new Date(today.getFullYear() - 100, 0, 1);
  const maxDate    = maximumDate ?? today;
  const pickerDate = value ?? new Date(today.getFullYear() - 25, 0, 1);

  // Android fires onChange immediately; iOS uses a modal
  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (selected) onChange(selected);
  };

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value ? formatDate(value) : 'DD / MM / YYYY'}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
      </Pressable>

      {/* ── Android: renders inline when open ── */}
      {Platform.OS === 'android' && open && (
        <DateTimePicker
          mode="date"
          display="calendar"
          value={pickerDate}
          minimumDate={minDate}
          maximumDate={maxDate}
          onChange={handleChange}
        />
      )}

      {/* ── iOS: modal with Done button ── */}
      {Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" visible={open}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label ?? 'Select date'}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <Text style={styles.doneBtn}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              mode="date"
              display="spinner"
              value={pickerDate}
              minimumDate={minDate}
              maximumDate={maxDate}
              onChange={handleChange}
              style={{ height: 200 }}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
  },
  fieldText:   { fontSize: 15, color: Colors.text },
  placeholder: { color: Colors.textMuted },

  // iOS modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  doneBtn:    { fontSize: 16, fontWeight: '600', color: Colors.primary },
});
