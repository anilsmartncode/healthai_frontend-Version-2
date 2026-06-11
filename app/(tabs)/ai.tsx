/**
 * app/(tabs)/ai.tsx — HealthAI Assistant
 */

import { useEffect, useRef } from 'react';
import {
  View, FlatList, StyleSheet, Text,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';
import { ChatBubble, TypingBubble } from '@/components/ai/ChatBubble';
import { ChatInput } from '@/components/ai/ChatInput';
import { SuggestedPrompts } from '@/components/ai/SuggestedPrompts';
import { AlertBanner } from '@/components/ai/AlertBanner';
import { useAI } from '@/hooks/useAI';
import type { ChatMessage } from '@/types';

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const { prefill, context } = useLocalSearchParams<{ prefill?: string; context?: string }>();
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const {
    messages, input, setInput, loading,
    suggestions, alert, send, clearConversation, dismissAlert,
  } = useAI(prefill, context);

  // Auto-scroll to bottom on new message or when keyboard opens
  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [messages.length, loading]);

  return (
    // edges={['top']} only — bottom padding handled manually so keyboard doesn't double-pad
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarSmall}>
            <Ionicons name="sparkles" size={16} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>HealthAI Assistant</Text>
            <Text style={styles.headerSub}>Powered by your health data</Text>
          </View>
        </View>
        <Pressable onPress={clearConversation} hitSlop={10} style={styles.clearBtn}>
          <Ionicons name="refresh-outline" size={20} color={Colors.textMuted} />
        </Pressable>
      </View>

      {/* Proactive alert banner — outside KAV so it doesn't shift */}
      {alert && (
        <AlertBanner
          alert={alert}
          onTap={() => { dismissAlert(); setInput(alert.prefill); }}
          onDismiss={dismissAlert}
        />
      )}

      {/*
        KeyboardAvoidingView:
        - iOS: behavior="padding" pushes content up by keyboard height
        - Android: behavior="height" shrinks the view instead (more reliable than padding on Android)
        keyboardVerticalOffset = top inset so the header stays pinned
      */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        {/* Chat list — fills all available space */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ChatBubble message={item} />}
          ListFooterComponent={loading ? <TypingBubble /> : null}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        />

        {/* Suggested prompts — shown only when conversation is fresh */}
        {messages.length <= 2 && !loading && (
          <SuggestedPrompts
            prompts={suggestions}
            onSelect={(p) => { setInput(p); send(p); }}
          />
        )}

        {/* Input bar — sits directly above keyboard */}
        <ChatInput
          value={input}
          onChangeText={setInput}
          onSend={() => send()}
          loading={loading}
          bottomInset={insets.bottom}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarSmall: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  headerSub:   { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  clearBtn:    { padding: 6 },
  list:        { padding: 16, gap: 12, paddingBottom: 8 },
});
