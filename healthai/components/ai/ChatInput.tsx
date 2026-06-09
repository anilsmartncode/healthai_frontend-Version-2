import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  onSend: () => void;
  loading?: boolean;
}

export function ChatInput({ value, onChangeText, onSend, loading }: Props) {
  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        placeholder="Ask about your health…"
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSend}
        returnKeyType="send"
        editable={!loading}
      />
      <Pressable onPress={onSend} disabled={loading || !value.trim()} style={styles.btn}>
        <Ionicons name="send" size={18} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg },
  input: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: Colors.text },
  btn:   { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
});
