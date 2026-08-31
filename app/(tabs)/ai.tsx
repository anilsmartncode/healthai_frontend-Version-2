/**
 * app/(tabs)/ai.tsx — HealthAI Chat Home (Screen 1 Redesigned)
 * Highly compact, mobile-first dashboard matching the mockup layout and sizing
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  TextInput, Platform, KeyboardAvoidingView, ScrollView,
  TouchableWithoutFeedback, Keyboard, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';
import { listChatSessions, ChatSessionSummary } from '@/services/aiService';
import { reportsApi } from '@/services/reportsApi';

const C = {
  primary: '#0D7B5F', // Deep emerald green
  primaryBg: '#E6F4EA', // Light green badge/banner bg
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  bg: Colors.bg,
  cardBg: '#FFFFFF',
};

function formatName(raw: string): string {
  if (!raw || /^[+\d\s\-()]{7,}$/.test(raw.trim())) return 'Arjun';
  const local = raw.includes('@') ? raw.split('@')[0] : raw;
  return local
    .split(/[._\-\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export default function AIHomeScreen() {
  const insets = useSafeAreaInsets();
  const { phone } = useAuth();
  const [userName, setUserName] = useState('Arjun');
  const [input, setInput] = useState('');
  const [recentChats, setRecentChats] = useState<ChatSessionSummary[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [loadingLatestReport, setLoadingLatestReport] = useState(false);

  // Load User Profile Name
  useEffect(() => {
    const cacheKey = `healthai_profile_name_${phone ?? 'guest'}`;
    AsyncStorage.getItem(cacheKey).then(name => {
      if (name && name.trim()) setUserName(name.trim());
      else setUserName(formatName(phone ?? 'Arjun'));
    });
  }, [phone]);

  // Load Recent Chat Conversations
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      setRecentLoading(true);
      listChatSessions(phone)
        .then(data => {
          if (active) {
            setRecentChats(data.slice(0, 2));
          }
        })
        .catch(err => console.warn('[AIHomeScreen] failed to load recent chats', err))
        .finally(() => {
          if (active) setRecentLoading(false);
        });
      return () => {
        active = false;
      };
    }, [phone])
  );

  const goToChat = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    router.push({ pathname: '/(tabs)/ai-chat', params: { prefill: trimmed, newSession: Date.now().toString() } });
    setInput('');
  };

  // Discuss Latest Report Handler
  const handleUnderstandReports = async () => {
    if (loadingLatestReport) return;
    setLoadingLatestReport(true);
    try {
      const list = await reportsApi.list(phone);
      const labReports = list.filter(r => r.reportType?.toUpperCase() !== 'PRESCRIPTION');

      if (labReports.length === 0) {
        setLoadingLatestReport(false);
        Alert.alert(
          "No Reports Found",
          "You haven't uploaded any medical lab reports yet. Please upload a report first to start discussing it with the AI.",
          [
            { text: "Upload Report", onPress: () => router.push('/upload') },
            { text: "Cancel", style: "cancel" }
          ]
        );
        return;
      }

      const latest = labReports[0];
      const fullReport = await reportsApi.getById(latest.id, phone);

      if (!fullReport) {
        throw new Error("Could not retrieve report details.");
      }

      const abnormal = (fullReport.values || []).filter(v => v.status === 'high' || v.status === 'low');
      let parsedSummary: any = null;
      try {
        parsedSummary = fullReport.summary ? JSON.parse(fullReport.summary) : null;
      } catch { }

      const prefillMsg = `My ${fullReport.reportType || 'report'} shows ${abnormal.length} abnormal value${abnormal.length !== 1 ? 's' : ''}${parsedSummary?.condition_severity ? ` and overall status is ${parsedSummary.condition_severity}` : ''}. What does this mean and what should I do?`;

      router.push({
        pathname: '/ai-chat',
        params: {
          prefill: prefillMsg,
          context: fullReport.summary ?? '',
          newSession: Date.now().toString(),
        }
      });

    } catch (err) {
      console.warn('[AIHomeScreen] Failed to load latest report context', err);
      Alert.alert("Error", "Failed to retrieve your latest report. Please try again.");
    } finally {
      setLoadingLatestReport(false);
    }
  };

  // Medicines Chat Prefill Handler
  const handleMedicinesInfo = () => {
    router.push({
      pathname: '/ai-chat',
      params: {
        prefill: "Hi! I have some questions about my medicines. Can you help me understand their usages, correct dosages, side effects, or interactions?",
        newSession: Date.now().toString(),
      }
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.mainContainer}>
            
            {/* Header */}
            <View style={styles.header}>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.headerTitle}>AI Assistant</Text>
                  <Text style={styles.sparkleEmoji}>✨</Text>
                </View>
                <Text style={styles.headerSubtitle}>Your intelligent health companion</Text>
              </View>
            </View>

            <ScrollView 
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              
              {/* Welcome Card Banner */}
              <View style={styles.welcomeCard}>
                <Text style={styles.welcomeTitle}>Hello, {userName} 👋</Text>
                <Text style={styles.welcomeSubtitle}>How can I help with your health today?</Text>
              </View>

              {/* 2x2 Grid Layout */}
              <View style={styles.grid}>
                {/* 1. Understand Reports */}
                <Pressable 
                  style={styles.gridCard} 
                  onPress={handleUnderstandReports}
                  disabled={loadingLatestReport}
                >
                  {loadingLatestReport ? (
                    <ActivityIndicator size="small" color={C.primary} style={styles.spinner} />
                  ) : (
                    <Text style={styles.cardEmoji}>📄</Text>
                  )}
                  <Text style={styles.gridCardLabel}>
                    {loadingLatestReport ? 'Loading latest...' : 'Understand reports'}
                  </Text>
                </Pressable>

                {/* 2. Medicines Info */}
                <Pressable style={styles.gridCard} onPress={handleMedicinesInfo}>
                  <Text style={styles.cardEmoji}>💊</Text>
                  <Text style={styles.gridCardLabel}>Medicines info</Text>
                </Pressable>

                {/* 3. Symptom Checker */}
                <Pressable style={styles.gridCard} onPress={() => router.push('/symptom-checker')}>
                  <Text style={styles.cardEmoji}>🖤</Text>
                  <Text style={styles.gridCardLabel}>Symptom checker</Text>
                </Pressable>

                {/* 4. Health Tools */}
                <Pressable style={styles.gridCard} onPress={() => router.push('/health-tools')}>
                  <Text style={styles.cardEmoji}>🧮</Text>
                  <Text style={styles.gridCardLabel}>Health tools</Text>
                </Pressable>
              </View>

              {/* Recent Conversations */}
              <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                  <Text style={styles.recentTitle}>Recent conversations</Text>
                  <Pressable onPress={() => router.push('/ai-history')} hitSlop={10}>
                    <Text style={styles.viewAllBtn}>View all</Text>
                  </Pressable>
                </View>

                <View style={styles.recentCardContainer}>
                  {recentLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={C.primary} />
                    </View>
                  ) : recentChats.length > 0 ? (
                    recentChats.map((item, idx) => (
                      <React.Fragment key={item.id}>
                        {idx > 0 && <View style={styles.divider} />}
                        <Pressable
                          style={styles.recentItem}
                          onPress={() => router.push({ pathname: '/(tabs)/ai-chat', params: { sessionId: item.id } })}
                        >
                          <View style={styles.chatIconBg}>
                            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#0D7B5F" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.recentItemText} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text style={styles.recentItemDate}>
                              {new Date(item.updatedAt).toLocaleDateString([], { day: 'numeric', month: 'short' })} · {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                        </Pressable>
                      </React.Fragment>
                    ))
                  ) : (
                    // Fallback preview items
                    <>
                      <Pressable
                        style={styles.recentItem}
                        onPress={() => goToChat("Explain my blood test report")}
                      >
                        <View style={styles.chatIconBg}>
                          <Ionicons name="chatbubble" size={16} color="#0D7B5F" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recentItemText} numberOfLines={1}>
                            Explain my blood test report
                          </Text>
                          <Text style={styles.recentItemDate}>
                            20 May · 10:30 AM
                          </Text>
                        </View>
                      </Pressable>
                      <View style={styles.divider} />
                      <Pressable
                        style={styles.recentItem}
                        onPress={() => goToChat("Best exercises for back pain")}
                      >
                        <View style={styles.chatIconBg}>
                          <Ionicons name="chatbubble" size={16} color="#0D7B5F" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recentItemText} numberOfLines={1}>
                            Best exercises for back pain
                          </Text>
                          <Text style={styles.recentItemDate}>
                            15 May · 11:20 AM
                          </Text>
                        </View>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>

            </ScrollView>

            {/* Bottom Search Input Bar */}
            <View
              style={[
                styles.bottomBarContainer,
                {
                  paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 16,
                },
              ]}
            >
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Ask anything about your health..."
                  placeholderTextColor={C.textMuted}
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={() => goToChat(input)}
                  returnKeyType="send"
                  maxLength={500}
                />

                <Pressable
                  style={[
                    styles.sendBtn,
                    input.trim() ? { opacity: 1 } : { opacity: 0.6 },
                  ]}
                  onPress={() => goToChat(input)}
                  disabled={!input.trim()}
                >
                  <Ionicons name="send" size={16} color={C.primary} />
                </Pressable>
              </View>
            </View>

          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  mainContainer: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sparkleEmoji: {
    fontSize: 18,
    marginLeft: 6,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },

  // Welcome Card
  welcomeCard: {
    backgroundColor: '#E6F4EA',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },

  // Grid Layout (Left-aligned, short height, raw emojis)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 80,
    justifyContent: 'center',
    gap: 6,
  },
  cardEmoji: {
    fontSize: 22,
  },
  spinner: {
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },

  // Recent Section
  recentSection: {
    marginBottom: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D7B5F',
  },
  recentCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 2,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  chatIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  recentItemDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 14,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom Input Bar
  bottomBarContainer: {
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  sendBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
