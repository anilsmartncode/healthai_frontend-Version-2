import React, { useState, useEffect } from 'react';
import { TextInput, StyleSheet, ActivityIndicator, Pressable, Platform } from 'react-native';
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

const MIN_INPUT_HEIGHT = 36;
const MAX_INPUT_HEIGHT = 76; // Holds 3 lines comfortably

export function ChatInput({ value, onChangeText, onSend, loading, bottomInset = 0, inline = false }: Props) {
  const [contentHeight, setContentHeight] = useState(MIN_INPUT_HEIGHT);

  useEffect(() => {
    if (!value || value.trim().length === 0) {
      setContentHeight(MIN_INPUT_HEIGHT);
    }
  }, [value]);

  const currentHeight = Math.min(Math.max(MIN_INPUT_HEIGHT, contentHeight), MAX_INPUT_HEIGHT);

  if (inline) {
    // Slim, borderless — parent handles the outer pill/card
    return (
      <TextInput
        style={[inlineStyles.input, { height: currentHeight }]}
        placeholder="Ask anything about your health..."
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        onContentSizeChange={(e) => {
          const h = e.nativeEvent.contentSize.height;
          if (h > 0) setContentHeight(h);
        }}
        onSubmitEditing={onSend}
        returnKeyType="send"
        editable={!loading}
        multiline
        scrollEnabled={contentHeight >= MAX_INPUT_HEIGHT}
        maxLength={1000}
      />
    );
  }

  // ── Standalone (used on other screens) ──────────────────────────────────────
  return (
    <TextInput
      style={[standaloneStyles.input, { height: Math.max(44, currentHeight), paddingBottom: 10 + bottomInset }]}
      placeholder="Ask about your health…"
      placeholderTextColor={Colors.textMuted}
      value={value}
      onChangeText={onChangeText}
      onContentSizeChange={(e) => {
        const h = e.nativeEvent.contentSize.height;
        if (h > 0) setContentHeight(h);
      }}
      onSubmitEditing={onSend}
      returnKeyType="send"
      editable={!loading}
      multiline
      scrollEnabled={contentHeight >= MAX_INPUT_HEIGHT}
      maxLength={1000}
    />
  );
}

const inlineStyles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    paddingTop: Platform.OS === 'ios' ? 8 : 6,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
    paddingHorizontal: 6,
    textAlignVertical: 'center',
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
  },
});