import { TextInput, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  onSend: () => void;
  loading?: boolean;
  bottomInset?: number;
  /** When true, renders a plain inline input with no surrounding card/border.
   *  Used when ai-chat.tsx provides its own styled bar. */
  inline?: boolean;
}

export function ChatInput({ value, onChangeText, onSend, loading, bottomInset = 0, inline = false }: Props) {
  const canSend = value.trim().length > 0 && !loading;

  if (inline) {
    // Slim, borderless — parent handles the outer pill/card
    return (
      <TextInput
        style={inlineStyles.input}
        placeholder="Type a message..."
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSend}
        returnKeyType="send"
        editable={!loading}
        multiline
        maxLength={500}
      />
    );
  }

  // ── Standalone (used on other screens) ──────────────────────────────────────
  return (
    <TextInput
      style={[standaloneStyles.input, { paddingBottom: 10 + bottomInset }]}
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
  );
}

const inlineStyles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 0,
    maxHeight: 100,
    minHeight: 20,
  },
});

const standaloneStyles = StyleSheet.create({
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingTop: 10,
    fontSize: 15, color: Colors.text,
    maxHeight: 100,
  },
});