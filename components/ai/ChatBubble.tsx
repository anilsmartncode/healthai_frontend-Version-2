import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';
import type { ChatMessage } from '@/types';

export function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const time = new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={14} color="#fff" />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.text, isUser && { color: '#fff' }]}>{message.text}</Text>
        <Text style={[styles.time, isUser && { color: 'rgba(255,255,255,0.65)' }]}>{time}</Text>
      </View>
    </View>
  );
}

export function TypingBubble() {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Ionicons name="sparkles" size={14} color="#fff" />
      </View>
      <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
        <View style={styles.dots}>
          <View style={[styles.dot, { opacity: 0.4 }]} />
          <View style={[styles.dot, { opacity: 0.65 }]} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '88%' },
  rowUser:    { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    flex: 1, padding: 12, borderRadius: Radius.lg,
    gap: 4,
  },
  bubbleAI: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  typingBubble: { paddingVertical: 14 },
  text:  { fontSize: 14, color: Colors.text, lineHeight: 21 },
  time:  { fontSize: 11, color: Colors.textMuted, alignSelf: 'flex-end' },
  dots:  { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot:   { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.textMuted },
});
