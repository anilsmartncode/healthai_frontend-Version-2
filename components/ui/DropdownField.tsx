/**
 * DropdownField.tsx
 * ─────────────────────────────────────────────────────────────────────
 * A reusable tappable field that opens a bottom-sheet list to pick one
 * option from a fixed list (e.g. Gender, Blood Group). Visually matches
 * DatePickerField so form screens look consistent.
 * ─────────────────────────────────────────────────────────────────────
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';

interface Props {
  label?: string;
  value: string | null;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DropdownField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={Colors.primary} />
      </Pressable>

      <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{label ?? 'Select'}</Text>
            <Pressable onPress={() => setOpen(false)}>
              <Text style={styles.doneBtn}>Done</Text>
            </Pressable>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            style={{ maxHeight: 320 }}
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <Pressable
                  style={[styles.optionRow, selected && styles.optionRowSelected]}
                  onPress={() => { onChange(item); setOpen(false); }}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {item}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={18} color={Colors.primary} />
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
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

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
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

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionRowSelected: { backgroundColor: Colors.surface },
  optionText:        { fontSize: 15, color: Colors.text },
  optionTextSelected:{ fontWeight: '700', color: Colors.primary },
});
