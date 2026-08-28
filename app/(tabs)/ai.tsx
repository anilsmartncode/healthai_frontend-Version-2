/**
 * app/(tabs)/ai.tsx — HealthAI Chat Home (Screen 1)
 * Centered hero welcome screen with dynamic keyboard-responsive input bar
 */

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  TextInput, Platform, KeyboardAvoidingView, Image,
  TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';
import { useLang } from '@/context/Languagecontext';

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

function getGreeting(t: (k: any) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t("good_morning");
  if (hour < 17) return t("good_afternoon");
  return t("good_evening");
}

export default function AIHomeScreen() {
  const insets = useSafeAreaInsets();
  const { phone } = useAuth();
  const { t, isRTL, textAlign, rowDirection } = useLang();
  const [userName, setUserName] = useState(formatName(phone ?? 'Rahul'));
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(36);

  useEffect(() => {
    if (!input || input.trim().length === 0) {
      setInputHeight(36);
    }
  }, [input]);

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
    router.push({ pathname: '/(tabs)/ai-chat', params: { prefill: trimmed, newSession: Date.now().toString() } });
    setInput('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.mainContainer}>
            {/* Brand Header */}
            <View style={styles.brandRow}>
              <Text style={styles.brandName}>HealthAI</Text>
              <Text style={styles.brandSub}>{t("onboard_title")}</Text>
              <Pressable
                style={styles.historyBtn}
                onPress={() => router.push('/ai-history')}
                hitSlop={8}
              >
                <Ionicons name="time-outline" size={20} color={C.text} />
              </Pressable>
            </View>

            {/* Centered Hero Welcome Area */}
            <View style={styles.centerHeroSection}>
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

              {/* Greeting & Subtitle */}
              <Text style={[styles.greeting, { textAlign }]}>{getGreeting(t)} {userName} 👋</Text>
              <Text style={[styles.subtitle, { textAlign }]}>{t("ai_how_can_help")}</Text>
            </View>

            {/* Dynamic Bottom Input Bar matching ai-chat.tsx */}
            <View
              style={[
                styles.bottomBarContainer,
                {
                  paddingBottom:
                    Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 16,
                },
              ]}
            >
              <View style={[styles.inputWrap, { flexDirection: rowDirection }]}>
                <Pressable
                  style={styles.innerPlusBtn}
                  onPress={() => router.push('/upload')}
                  hitSlop={8}
                >
                  <Ionicons name="add" size={24} color={C.textMuted} />
                </Pressable>

                <TextInput
                  style={[
                    styles.input,
                    { height: Math.min(Math.max(36, inputHeight), 120), textAlign },
                  ]}
                  placeholder={t("ai_placeholder")}
                  placeholderTextColor={C.textMuted}
                  value={input}
                  onChangeText={setInput}
                  onContentSizeChange={(e) => {
                    const h = e.nativeEvent.contentSize.height;
                    if (h > 0) setInputHeight(h);
                  }}
                  onSubmitEditing={() => goToChat(input)}
                  returnKeyType="send"
                  multiline
                  scrollEnabled={inputHeight >= 120}
                  maxLength={15000}
                />

                <Pressable
                  style={[
                    styles.innerActionBtn,
                    input.trim()
                      ? { backgroundColor: C.primary }
                      : { backgroundColor: '#F1F5F9' },
                  ]}
                  onPress={() =>
                    input.trim() ? goToChat(input) : router.push({ pathname: '/(tabs)/ai-chat', params: { newSession: Date.now().toString() } })
                  }
                  hitSlop={6}
                >
                  {input.trim() ? (
                    <Ionicons name="arrow-up" size={18} color="#fff" />
                  ) : (
                    <Ionicons name="mic" size={18} color={C.textMuted} />
                  )}
                </Pressable>
              </View>
              <Text style={[styles.disclaimerText, { textAlign }]}>
                {t("ai_medical_disclaimer")}
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },

  brandRow: {
    alignItems: 'center',
    paddingTop: 14,
    paddingHorizontal: 20,
    marginBottom: 8,
    position: 'relative',
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  brandSub: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 1,
    textAlign: 'center',
  },
  historyBtn: {
    position: 'absolute',
    right: 20,
    top: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerHeroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    height: 220,
    marginBottom: 20,
  },
  ring3: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#DBEAFE44',
  },
  ring2: {
    position: 'absolute',
    width: 178,
    height: 178,
    borderRadius: 89,
    backgroundColor: '#BFDBFE55',
  },
  ring1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#93C5FD44',
  },
  nurseCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  nurseImage: {
    width: 170,
    height: 170,
  },

  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
  },

  bottomBarContainer: {
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 48,
    maxHeight: 140,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 1,
      },
    }),
  },
  innerPlusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
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
  innerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  disclaimerText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },
});


