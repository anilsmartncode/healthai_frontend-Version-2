/**
 * app/(tabs)/ai.tsx — HealthAI Chat Home (Screen 1)
 * Pixel-accurate match to mockup screen 1
 */

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, Platform, KeyboardAvoidingView, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';

const C = {
  primary: '#2563EB',
  primaryBg: '#EFF6FF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  success: '#16A34A',
};

function formatName(raw: string): string {
  if (/^[+\d\s\-()]{7,}$/.test(raw.trim())) return 'there';
  const local = raw.includes('@') ? raw.split('@')[0] : raw;
  return local
    .split(/[._\-\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const QUICK_ACTIONS = [
  { icon: 'pulse-outline' as const, label: 'Symptom\nChecker', bg: '#F3F0FF', color: '#7C3AED', prefill: 'I have these symptoms, can you help me understand what they might mean?' },
  { icon: 'calendar-outline' as const, label: 'Book\nDoctor', bg: '#EFF6FF', color: '#2563EB', prefill: 'I would like to book a doctor appointment.' },
  { icon: 'medkit-outline' as const, label: 'Order\nMedicine', bg: '#FFF7ED', color: '#EA580C', prefill: 'I want to order my recommended medicines.' },
  { icon: 'document-text-outline' as const, label: 'Upload\nReports', bg: '#F0FDF4', color: '#16A34A', route: '/upload' as any },
  { icon: 'folder-open-outline' as const, label: 'Health\nRecords', bg: '#FDF4FF', color: '#C026D3', route: '/reports' as any },
  { icon: 'alarm-outline' as const, label: 'Medicine\nReminder', bg: '#FFFBEB', color: '#D97706', route: '/medicines/reminders' as any },
  { icon: 'flask-outline' as const, label: 'Lab\nTests', bg: '#ECFEFF', color: '#0891B2', prefill: 'What lab tests should I consider getting done?' },
  { icon: 'alert-circle-outline' as const, label: 'Emergency\nSOS', bg: '#FEF2F2', color: '#DC2626', route: '/family/emergency' as any },
];

export default function AIHomeScreen() {
  const insets = useSafeAreaInsets();
  const { phone } = useAuth();
  const [userName, setUserName] = useState(formatName(phone ?? 'Rahul'));
  const [input, setInput] = useState('');

  useEffect(() => {
    const cacheKey = `healthai_profile_name_${phone ?? 'guest'}`;
    AsyncStorage.getItem(cacheKey).then(name => {
      if (name && name.trim()) setUserName(name.trim());
      else setUserName(formatName(phone ?? 'Rahul'));
    });
  }, [phone]);

  const goToChat = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    router.push({ pathname: '/ai-chat', params: { prefill: trimmed } });
    setInput('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand row */}
          <View style={styles.brandRow}>
            <View>
              <Text style={styles.brandName}>HealthAI</Text>
              <Text style={styles.brandSub}>Your AI Health Companion</Text>
            </View>
            <Pressable style={styles.historyBtn} onPress={() => router.push('/ai-history')} hitSlop={8}>
              <Ionicons name="time-outline" size={24} color={C.text} />
            </Pressable>
          </View>

          {/* Greeting */}
          <Text style={styles.greeting}>{getGreeting()}, {userName} 👋</Text>
          <Text style={styles.subtitle}>How can I help you today?</Text>

          {/* Nurse avatar hero with concentric rings */}
          <View style={styles.heroWrap}>
            <View style={styles.ring3} />
            <View style={styles.ring2} />
            <View style={styles.ring1} />
            <View style={styles.nurseCircle}>
              <Image
                source={require('../../assets/images/nurse_avatar.png')}
                style={styles.nurseImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Chat input */}
          <View style={styles.inputRow}>
            <View style={styles.inputWrap}>
              <Pressable style={styles.innerPlusBtn}>
                <Ionicons name="add" size={24} color={C.textMuted} />
              </Pressable>

              <TextInput
                style={styles.input}
                placeholder="Ask anything about your health"
                placeholderTextColor={C.textMuted}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => goToChat(input)}
                returnKeyType="send"
                multiline
              />

              <Pressable
                style={[styles.innerMicBtn, input.trim() ? { backgroundColor: C.primary } : { backgroundColor: '#F1F5F9' }]}
                onPress={() => input.trim() ? goToChat(input) : router.push('/ai-chat')}
              >
                {input.trim()
                  ? <Ionicons name="arrow-up" size={18} color="#fff" />
                  : <Ionicons name="mic" size={18} color={C.textMuted} />
                }
              </Pressable>
            </View>
          </View>

          {/* Section label */}
          <Text style={styles.sectionLabel}>Or try one of these</Text>

          {/* Quick actions grid — 4 columns */}
          <View style={styles.grid}>
            {QUICK_ACTIONS.map((a) => (
              <Pressable
                key={a.label}
                style={({ pressed }) => [styles.gridItem, pressed && { opacity: 0.72 }]}
                onPress={() => {
                  if (a.route) router.push(a.route);
                  else if (a.prefill) goToChat(a.prefill);
                }}
              >
                <View style={[styles.gridIconWrap, { backgroundColor: a.bg }]}>
                  <Ionicons name={a.icon} size={22} color={a.color} />
                </View>
                <Text style={styles.gridLabel} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{a.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Privacy Promise banner */}
          <Pressable style={styles.privacyBanner}>
            <View style={styles.privacyIconWrap}>
              <Ionicons name="shield-checkmark-outline" size={20} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.privacyTitle}>HealthAI Privacy Promise</Text>
              <Text style={styles.privacySub}>
                Your health data is 100% safe and secure with end-to-end encryption.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 14 },

  brandRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 14,
  },
  brandName: { fontSize: 26, fontWeight: '800', color: C.primary, letterSpacing: -0.3 },
  brandSub: { fontSize: 12, color: C.textMuted, marginTop: 1 },
  historyBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },

  greeting: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 2 },
  subtitle: { fontSize: 14, color: C.textMuted, marginBottom: 16 },

  heroWrap: {
    alignItems: 'center', justifyContent: 'center',
    height: 230, marginBottom: 20,
  },
  ring3: {
    position: 'absolute', width: 218, height: 218, borderRadius: 109,
    backgroundColor: '#DBEAFE44',
  },
  ring2: {
    position: 'absolute', width: 176, height: 176, borderRadius: 88,
    backgroundColor: '#BFDBFE55',
  },
  ring1: {
    position: 'absolute', width: 138, height: 138, borderRadius: 69,
    backgroundColor: '#93C5FD44',
  },
  nurseCircle: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  nurseImage: { width: 200, height: 200 },

  inputRow: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 28,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 52,
    shadowColor: C.text,
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  innerPlusBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 6,
  },
  input: {
    flex: 1, fontSize: 12, color: C.text,
    maxHeight: 100, minHeight: 36,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  innerMicBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 6,
  },

  sectionLabel: {
    fontSize: 13, fontWeight: '600', color: C.textMuted, marginBottom: 12,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  gridItem: {
    width: '22%', flexGrow: 1,
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    paddingVertical: 14, paddingHorizontal: 6,
    gap: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  gridIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  gridLabel: { fontSize: 11, fontWeight: '600', color: C.text, textAlign: 'center', lineHeight: 15 },

  privacyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
    padding: 14,
  },
  privacyIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  privacyTitle: { fontSize: 13, fontWeight: '700', color: C.text },
  privacySub: { fontSize: 11, color: C.textMuted, marginTop: 2, lineHeight: 16 },
});
