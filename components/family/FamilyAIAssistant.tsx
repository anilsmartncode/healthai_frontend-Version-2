/**
 * FamilyAIAssistant.tsx — S11 AI assistant widget
 * Mirrors the s-ai screen: avatar, input, chips, response card.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useFamilyAI } from '@/hooks/useFamily';

export function FamilyAIAssistant() {
  const { answer, suggestions, loading, ask } = useFamilyAI();
  const [query, setQuery] = useState('');

  const submit = () => { if (query.trim()) { ask(query.trim()); } };
  const pickChip = (q: string) => { setQuery(q); ask(q); };

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={32} color={Colors.primary} />
        </View>
        <Text style={styles.heroTitle}>Ask anything about your{'\n'}family's health</Text>
      </View>

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.inp}
          placeholder="Type your question…"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={submit}
          returnKeyType="send"
        />
        <Pressable style={styles.micBtn}>
          <Ionicons name="mic-outline" size={20} color={Colors.primary} />
        </Pressable>
      </View>

      {/* Suggestion chips */}
      <View style={styles.chips}>
        {suggestions.map((s) => (
          <Pressable key={s} style={({ pressed }) => [styles.chip, pressed && { backgroundColor: '#E8F5F0' }]} onPress={() => pickChip(s)}>
            <Text style={styles.chipTxt}>{s}</Text>
          </Pressable>
        ))}
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingTxt}>Analysing family health data…</Text>
        </View>
      )}

      {/* Answer */}
      {!loading && answer && (
        <View style={styles.answerBox}>
          <View style={styles.answerHeader}>
            <Ionicons name="sparkles" size={14} color={Colors.primary} />
            <Text style={styles.answerTitle}>AI Health Insight</Text>
          </View>
          <Text style={styles.answerTxt}>{answer}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page:        { padding: 16, paddingBottom: 40 },
  hero:        { alignItems: 'center', paddingVertical: 20 },
  aiAvatar:    { width: 68, height: 68, borderRadius: 34, backgroundColor: '#E8F5F0', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  heroTitle:   { fontSize: 16, fontWeight: '600', color: Colors.text, textAlign: 'center', lineHeight: 24 },
  inputRow:    { flexDirection: 'row', gap: 10, marginBottom: 14 },
  inp:         { flex: 1, backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 11, fontSize: 14, color: Colors.text },
  micBtn:      { width: 44, height: 44, borderRadius: 12, backgroundColor: '#E8F5F0', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  chips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip:        { backgroundColor: '#fff', borderRadius: 20, paddingVertical: 7, paddingHorizontal: 13, borderWidth: 0.5, borderColor: Colors.border },
  chipTxt:     { fontSize: 12, color: Colors.text },
  loading:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  loadingTxt:  { fontSize: 13, color: Colors.textMuted },
  answerBox:   { backgroundColor: '#E8F5F0', borderRadius: 14, padding: 14 },
  answerHeader:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  answerTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  answerTxt:   { fontSize: 13, color: Colors.text, lineHeight: 20 },
});
