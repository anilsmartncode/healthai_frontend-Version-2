import { View, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  onSend: () => void;
  loading?: boolean;
  bottomInset?: number; // safe area bottom inset passed from screen
}

export function ChatInput({ value, onChangeText, onSend, loading, bottomInset = 0 }: Props) {
  const canSend = value.trim().length > 0 && !loading;
  return (
    <View style={[styles.row, { paddingBottom: 12 + bottomInset }]}>
      <TextInput
        style={styles.input}
        placeholder="Ask about your health…"
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSend}
        returnKeyType="send"
        editable={!loading}
        multiline
        maxLength={500}
      />
      <Pressable
        onPress={onSend}
        disabled={!canSend}
        style={[styles.btn, canSend ? styles.btnActive : styles.btnDisabled]}
      >
        {loading
          ? <ActivityIndicator size="small" color="#fff" />
          : <Ionicons name="send" size={18} color="#fff" />
        }
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', gap: 8,
    paddingTop: 10, paddingHorizontal: 12,
    borderTopWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bg,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 15, color: Colors.text,
    maxHeight: 100,
  },
  btn:         { borderRadius: Radius.md, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  btnActive:   { backgroundColor: Colors.primary },
  btnDisabled: { backgroundColor: Colors.border },
});
