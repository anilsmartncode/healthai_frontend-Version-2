/**
 * app/ai-chat.tsx — HealthAI Chat Conversation (Screens 2 & 3)
 * Pixel-accurate match to mockup
 */

import { useEffect, useRef, useState } from 'react';
import {
  View, FlatList, StyleSheet, Text, Image, ScrollView,
  KeyboardAvoidingView, Platform, Pressable, TextInput, Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAI } from '@/hooks/useAI';
import { AlertBanner } from '@/components/ai/AlertBanner';
import { ChatInput } from '@/components/ai/ChatInput';
import { useUsage } from '@/context/UsageContext';
import type { ChatMessage } from '@/types';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import { LanguageSelectModal } from '@/components/ui/LanguageSelectModal';
import * as Clipboard from 'expo-clipboard';

const C = {
  primary:   '#2563EB',
  primaryBg: '#EFF6FF',
  text:      '#0F172A',
  textMuted: '#64748B',
  border:    '#E2E8F0',
  bg:        '#FFFFFF',
  surface:   '#F8FAFC',
  success:   '#16A34A',
  chatBg:    '#F0F4F8',
};

// ── Avatar helper ─────────────────────────────────────────────────────────────

function NurseAvatar({ size = 34 }: { size?: number }) {
  return (
    <View style={[avatarStyles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image
        source={require('../../assets/images/nurse_avatar.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  wrap: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ── Chat Bubble ───────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const time = new Date(message.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const [langModalOpen, setLangModalOpen] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const textToCopy = translatedText ?? message.text;

  const handleCopy = async () => {
    if (!textToCopy) return;
    try {
      await Clipboard.setStringAsync(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('[Clipboard] Failed to copy text:', err);
    }
  };

  const handleTranslate = async (langCode: string, langName: string) => {
    setTranslating(true);
    try {
      const res = await api.request<any>(ENDPOINTS.translateTextPath, {
        method: 'POST',
        body: JSON.stringify({
          text: message.text,
          language: langCode,
        }),
      });
      const trText = res?.translate_text ?? res?.translated_text ?? message.text;
      setTranslatedText(trText);
    } catch (err) {
      console.warn('[Translation] Chat bubble translation failed:', err);
      Alert.alert('Translation Error', 'Failed to translate message.');
    } finally {
      setTranslating(false);
    }
  };

  return (
    <View style={[bubbleStyles.row, isUser && bubbleStyles.rowUser]}>
      {!isUser && <NurseAvatar />}
      <Pressable
        onLongPress={handleCopy}
        delayLongPress={300}
        style={[bubbleStyles.bubble, isUser ? bubbleStyles.bubbleUser : bubbleStyles.bubbleAI]}
      >
        <Text style={[bubbleStyles.text, isUser && { color: '#fff' }]}>{textToCopy}</Text>

        {/* Footer row: Actions on Left, Timestamp on Right */}
        <View style={bubbleStyles.footerRow}>
          {/* Left Actions (Copy & Translate) */}
          <View style={bubbleStyles.actionsLeft}>
            <Pressable
              onPress={handleCopy}
              hitSlop={8}
              style={[
                bubbleStyles.actionBtn,
                isUser ? bubbleStyles.actionBtnUser : bubbleStyles.actionBtnAI,
              ]}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={12}
                color={
                  isUser
                    ? copied
                      ? '#A7F3D0'
                      : 'rgba(255,255,255,0.85)'
                    : copied
                    ? C.success
                    : C.textMuted
                }
              />
              <Text
                style={[
                  bubbleStyles.actionText,
                  {
                    color: isUser
                      ? copied
                        ? '#A7F3D0'
                        : 'rgba(255,255,255,0.85)'
                      : copied
                      ? C.success
                      : C.textMuted,
                  },
                ]}
              >
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>

            {!isUser && (
              <Pressable
                onPress={() => setLangModalOpen(true)}
                hitSlop={8}
                style={[bubbleStyles.actionBtn, bubbleStyles.actionBtnAI]}
                disabled={translating}
              >
                {translating ? (
                  <ActivityIndicator
                    size="small"
                    color={C.primary}
                    style={{ transform: [{ scale: 0.7 }] }}
                  />
                ) : (
                  <Ionicons name="language" size={12} color={C.primary} />
                )}
                <Text
                  style={[
                    bubbleStyles.actionText,
                    { color: C.primary, fontWeight: '600' },
                  ]}
                >
                  {translating ? 'Translating...' : 'Translate'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Right Timestamp (+ checkmark for user) */}
          <View style={bubbleStyles.timeRight}>
            <Text
              style={[
                bubbleStyles.time,
                isUser && { color: 'rgba(255,255,255,0.7)' },
              ]}
            >
              {time}
            </Text>
            {isUser && (
              <Ionicons
                name="checkmark-done"
                size={13}
                color="rgba(255,255,255,0.85)"
              />
            )}
          </View>
        </View>
      </Pressable>

      <LanguageSelectModal
        visible={langModalOpen}
        onClose={() => setLangModalOpen(false)}
        onSelect={handleTranslate}
      />
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '88%',
    marginBottom: 8,
  },
  rowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  bubble: {
    paddingHorizontal: 13,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: 18,
    gap: 6,
    flexShrink: 1,
    minWidth: 140,
  },
  bubbleAI: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: C.primary,
    borderBottomRightRadius: 4,
  },
  text: { fontSize: 14, color: C.text, lineHeight: 21 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    gap: 8,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  actionBtnUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  actionBtnAI: {
    backgroundColor: '#F1F5F9',
  },
  actionText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  timeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  time: { fontSize: 10, color: C.textMuted },
});

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingBubble() {
  return (
    <View style={[bubbleStyles.row, { marginBottom: 8 }]}>
      <NurseAvatar />
      <View style={[bubbleStyles.bubble, bubbleStyles.bubbleAI, { paddingVertical: 16, minWidth: 64 }]}>
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
          <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.primary, opacity: 0.3 }} />
          <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.primary, opacity: 0.6 }} />
          <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.primary }} />
        </View>
      </View>
    </View>
  );
}

// ── Symptom Chips ─────────────────────────────────────────────────────────────

const SYMPTOM_CHIPS = ['Body ache', 'Sore throat', 'Cough', 'Nausea', 'Fatigue', 'Chills'];

function SymptomChips({ onSelect }: { onSelect: (s: string) => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (s: string) =>
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  return (
    <View style={chipStyles.wrap}>
      {/* Question bubble */}
      <View style={chipStyles.bubbleRow}>
        <NurseAvatar />
        <View style={chipStyles.bubble}>
          <Text style={chipStyles.question}>Do you also have any of{'\n'}these symptoms?</Text>
        </View>
      </View>
      {/* Chip grid */}
      <View style={chipStyles.chips}>
        {SYMPTOM_CHIPS.map(s => {
          const active = selected.includes(s);
          return (
            <Pressable
              key={s}
              style={({ pressed }) => [
                chipStyles.chip,
                active && chipStyles.chipActive,
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => { toggle(s); if (!active) onSelect(s); }}
            >
              <Text style={[chipStyles.chipText, active && chipStyles.chipTextActive]}>{s}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  wrap:      { marginBottom: 8, gap: 10 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '86%' },
  bubble: {
    flex: 1, backgroundColor: C.bg,
    borderRadius: 18, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: C.border,
    padding: 12,
  },
  question:       { fontSize: 14, fontWeight: '700', color: C.text, lineHeight: 20 },
  chips:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 42 },
  chip: {
    borderWidth: 1.5, borderColor: '#CBD5E1',
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: C.bg,
  },
  chipActive:     { borderColor: C.primary, backgroundColor: '#EFF6FF' },
  chipText:       { fontSize: 13, color: C.text, fontWeight: '500' },
  chipTextActive: { color: C.primary, fontWeight: '700' },
});

// ── Condition Card (Screen 3) ─────────────────────────────────────────────────

const CONDITION_TIPS = [
  'Rest well and stay hydrated',
  'Drink warm fluids',
  'Take paracetamol if fever above 100°F',
  'Gargle warm salt water',
  'Avoid cold and heavy meals',
];

const HELP_ACTIONS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'calendar-outline',      label: 'Book Doctor Appointment' },
  { icon: 'medkit-outline',        label: 'Order Recommended Medicines' },
  { icon: 'location-outline',      label: 'Find Nearby Clinics' },
  { icon: 'document-text-outline', label: 'Upload Reports' },
];

function ConditionCard() {
  return (
    <View style={condStyles.outerRow}>
      <NurseAvatar />
      <View style={condStyles.card}>

        {/* Intro */}
        <Text style={condStyles.intro}>Based on your symptoms, here are my suggestions:</Text>
        <Text style={condStyles.introTime}>09:44 AM</Text>

        {/* Condition box */}
        <View style={condStyles.conditionBox}>
          <Text style={condStyles.possibleLabel}>Possible Condition</Text>
          <View style={condStyles.conditionHeader}>
            <View style={condStyles.shieldWrap}>
              <Ionicons name="shield-checkmark" size={22} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={condStyles.conditionName}>Viral Fever</Text>
              <Text style={condStyles.conditionSub}>(Common Cold)</Text>
            </View>
          </View>
          <Text style={condStyles.conditionDesc}>
            This is usually caused by viral infection and gets better with rest and care.
          </Text>
        </View>

        {/* What you can do */}
        <Text style={condStyles.sectionTitle}>What you can do</Text>
        {CONDITION_TIPS.map(tip => (
          <View key={tip} style={condStyles.tipRow}>
            <Ionicons name="checkmark-circle" size={17} color={C.success} />
            <Text style={condStyles.tipText}>{tip}</Text>
          </View>
        ))}

        {/* Doctor advice */}
        <View style={condStyles.doctorBox}>
          <Text style={condStyles.doctorText}>
            If symptoms worsen or persist for more than 3 days, consult a doctor.
          </Text>
          <View style={condStyles.doctorAvatarCircle}>
            <Ionicons name="person" size={18} color={C.primary} />
          </View>
        </View>

        {/* I can also help */}
        <Text style={condStyles.alsoHelp}>I can also help you with:</Text>
        {HELP_ACTIONS.map(a => (
          <Pressable
            key={a.label}
            style={({ pressed }) => [condStyles.helpRow, pressed && { opacity: 0.7 }]}
            onPress={() => {
              if (a.label === 'Upload Reports') {
                router.push('/upload');
              } else {
                Alert.alert('Coming Soon', `${a.label} will be available in a future update.`);
              }
            }}
          >
            <View style={condStyles.helpIconWrap}>
              <Ionicons name={a.icon} size={18} color={C.primary} />
            </View>
            <Text style={condStyles.helpLabel}>{a.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
          </Pressable>
        ))}

        {/* Closing */}
        <View style={condStyles.closingWrap}>
          <Text style={condStyles.closingText}>Is there anything else I can help you with?</Text>
          <Text style={condStyles.closingTime}>09:45 AM</Text>
        </View>
      </View>
    </View>
  );
}

const condStyles = StyleSheet.create({
  outerRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, maxWidth: '97%', marginBottom: 8 },
  card: {
    flex: 1, backgroundColor: C.bg,
    borderRadius: 18, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: C.border,
    padding: 14, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  intro:     { fontSize: 14, color: C.text, lineHeight: 20 },
  introTime: { fontSize: 10, color: C.textMuted, alignSelf: 'flex-end', marginTop: -6 },

  conditionBox: {
    borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF', padding: 12, gap: 8,
  },
  possibleLabel: {
    fontSize: 10, fontWeight: '700', color: C.primary,
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  conditionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shieldWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center',
  },
  conditionName: { fontSize: 18, fontWeight: '800', color: C.text },
  conditionSub:  { fontSize: 12, color: C.textMuted, marginTop: 1 },
  conditionDesc: { fontSize: 13, color: C.text, lineHeight: 19 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  tipRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipText:      { fontSize: 13, color: C.text, flex: 1 },

  doctorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F0F9FF', borderRadius: 12,
    borderWidth: 1, borderColor: '#BAE6FD', padding: 12,
  },
  doctorText:        { flex: 1, fontSize: 12, color: C.text, lineHeight: 18 },
  doctorAvatarCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#DBEAFE',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  alsoHelp: { fontSize: 13, fontWeight: '700', color: C.text },
  helpRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
  },
  helpIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  helpLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: C.text },

  closingWrap: {
    backgroundColor: C.bg, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    padding: 12, marginTop: 2, gap: 4,
  },
  closingText: { fontSize: 14, color: C.text, lineHeight: 20 },
  closingTime: { fontSize: 10, color: C.textMuted, alignSelf: 'flex-end' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AIChatScreen() {
  const insets = useSafeAreaInsets();
  const { prefill, context, sessionId: openSessionId } = useLocalSearchParams<{
    prefill?: string; context?: string; sessionId?: string;
  }>();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSymptomChips, setShowSymptomChips] = useState(false);
  const [inputText, setInputText] = useState('');

  const {
    messages, input, setInput, loading,
    suggestions, alert, send, clearConversation, dismissAlert,
  } = useAI(prefill, context, openSessionId);

  const [inputHeight, setInputHeight] = useState(36);

  useEffect(() => {
    if (!input || input.trim().length === 0) {
      setInputHeight(36);
    }
  }, [input]);

  const { canSendAiChat, incrementAiChat, setShowPaywall } = useUsage();

  const handleSend = async () => {
    if (!canSendAiChat()) {
      setShowPaywall(true);
      return;
    }
    await incrementAiChat();
    send();
  };

  const filteredSuggestions = input.trim().length > 0
    ? suggestions.filter(s => s.toLowerCase().includes(input.trim().toLowerCase()) && s.toLowerCase() !== input.trim().toLowerCase())
    : [];

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [messages.length, loading]);

  useEffect(() => {
    const userMsgs = messages.filter(m => m.role === 'user').length;
    if (userMsgs >= 1) setShowSymptomChips(true);
  }, [messages]);

  const renderItem = ({ item, index }: { item: ChatMessage; index: number }) => (
    <>
      <ChatBubble message={item} />
      {showSymptomChips && item.role === 'ai' && index === 1 && (
        <SymptomChips onSelect={(s) => { setInput(prev => prev ? `${prev}, ${s}` : s); }} />
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/ai')}
            hitSlop={10}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </Pressable>
          <NurseAvatar size={38} />
          <View>
            <Text style={styles.headerTitle}>HealthAI</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>
        <Pressable onPress={() => setMenuOpen(o => !o)} hitSlop={10}>
          <Ionicons name="ellipsis-vertical" size={20} color={C.textMuted} />
        </Pressable>
      </View>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
          <View style={styles.menu}>
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.65 }]}
              onPress={() => { setMenuOpen(false); router.push('/ai-history'); }}
            >
              <Ionicons name="time-outline" size={18} color={C.text} />
              <Text style={styles.menuText}>History</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.65 }]}
              onPress={() => {
                setMenuOpen(false);
                clearConversation();
                setShowSymptomChips(false);
              }}
            >
              <Ionicons name="add-circle-outline" size={18} color={C.text} />
              <Text style={styles.menuText}>New Chat</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Alert banner */}
      {alert && (
        <AlertBanner
          alert={alert}
          onTap={() => { dismissAlert(); setInput(alert.prefill); }}
          onDismiss={dismissAlert}
        />
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        {/* Message list */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          ListFooterComponent={
            <>
              {loading && <TypingBubble />}
            </>
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        />

        {/* Autocomplete Suggestions */}
        {filteredSuggestions.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionsContainer}
            contentContainerStyle={styles.suggestionsContent}
            keyboardShouldPersistTaps="always"
          >
            {filteredSuggestions.map(s => (
              <Pressable 
                key={s} 
                style={({ pressed }) => [styles.suggestionChip, pressed && { opacity: 0.7 }]}
                onPress={() => setInput(s)}
              >
                <Ionicons name="sparkles-outline" size={13} color={C.primary} style={{ marginRight: 5 }} />
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 16 }]}>
          <View style={styles.inputWrap}>
            <Pressable style={styles.innerPlusBtn}>
              <Ionicons name="add" size={24} color={C.textMuted} />
            </Pressable>
            
            <TextInput
              style={[
                styles.input,
                { height: Math.min(Math.max(36, inputHeight), 76) }
              ]}
              value={input}
              onChangeText={setInput}
              onContentSizeChange={(e) => {
                const h = e.nativeEvent.contentSize.height;
                if (h > 0) setInputHeight(h);
              }}
              placeholder="Ask anything about your health..."
              placeholderTextColor={C.textMuted}
              multiline
              scrollEnabled={inputHeight >= 76}
              maxLength={1000}
            />

            <Pressable 
              style={[styles.innerMicBtn, input.trim() ? { backgroundColor: C.primary } : { backgroundColor: '#F1F5F9' }]} 
              onPress={handleSend}
            >
              {input.trim()
                ? <Ionicons name="arrow-up" size={18} color="#fff" />
                : <Ionicons name="mic" size={18} color={C.textMuted} />
              }
            </Pressable>
          </View>
          <Text style={styles.disclaimerText}>Your health matters. Use these insights as a guide and reach out to a healthcare professional when needed.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.chatBg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderColor: C.border,
    backgroundColor: C.bg,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn:     { marginRight: 2 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: C.text },
  onlineRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  onlineDot:   { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.success },
  onlineText:  { fontSize: 11, color: C.success, fontWeight: '600' },

  menuBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 },
  menu: {
    position: 'absolute', top: 58, right: 12, zIndex: 20,
    backgroundColor: C.bg, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, minWidth: 160,
    paddingVertical: 4,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  menuItem:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  menuText:    { fontSize: 14, fontWeight: '500', color: C.text },
  menuDivider: { height: 1, backgroundColor: C.border },

  list: { padding: 16, gap: 2, paddingBottom: 10 },

  inputBar: {
    paddingHorizontal: 16, paddingTop: 10,
    backgroundColor: C.chatBg,
  },
  disclaimerText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    lineHeight: 14,
  },
  inputWrap: { 
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, 
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 48,
    maxHeight: 88,
    shadowColor: C.text,
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: C.text,
    paddingTop: Platform.OS === 'ios' ? 8 : 6,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
    paddingHorizontal: 6,
    textAlignVertical: 'center',
  },
  innerPlusBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 4,
  },
  innerMicBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 4,
  },
  suggestionsContainer: {
    height: 52,
    borderTopWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    flexShrink: 0,
  },
  suggestionsContent: {
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '600',
    lineHeight: 18,
  },
});
