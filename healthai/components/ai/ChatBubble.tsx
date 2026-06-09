import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius } from '@/constants/Colors';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.wrap, isUser && styles.wrapUser]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.text, isUser && { color: '#fff' }]}>{message.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:       { marginVertical: 4, maxWidth: '80%' },
  wrapUser:   { alignSelf: 'flex-end' },
  bubble:     { padding: 12, borderRadius: Radius.lg },
  bubbleAI:   { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignSelf: 'flex-start' },
  bubbleUser: { backgroundColor: Colors.primary, alignSelf: 'flex-end' },
  text:       { color: Colors.text, lineHeight: 20 },
});
