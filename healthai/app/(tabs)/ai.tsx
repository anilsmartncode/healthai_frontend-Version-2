import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { Colors, Radius } from '@/constants/Colors';
import { aiService } from '@/services/ai';
import type { ChatMessage } from '@/types';

export default function AI() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'ai', text: 'Hello! I am your AI Health Assistant. How can I help today?', time: new Date().toISOString() },
  ]);
  const [text, setText] = useState('');

  const send = async () => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text, time: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    const q = text;
    setText('');
    const reply = await aiService.ask(q);
    setMessages((m) => [...m, reply]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={messages}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.user : styles.ai]}>
              <Text style={[styles.text, item.role === 'user' && { color: '#fff' }]}>{item.text}</Text>
            </View>
          )}
        />
        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <Input placeholder="Ask your question…" value={text} onChangeText={setText} onSubmitEditing={send} />
          </View>
          <Pressable onPress={send} style={styles.sendBtn}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bubble: { padding: 12, borderRadius: Radius.lg, maxWidth: '85%' },
  ai: { backgroundColor: Colors.surface, alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.border },
  user: { backgroundColor: Colors.primary, alignSelf: 'flex-end' },
  text: { color: Colors.text, fontSize: 14 },
  inputRow: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  sendBtn: { backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 14, borderRadius: Radius.md },
});
