/**
 * app/(tabs)/ai.tsx — HealthAI Chat Home (Screen 1 Redesigned)
 * Grid-based hub matching the mockup with quick actions, recent conversations, and bottom input
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  TextInput, Platform, KeyboardAvoidingView, ScrollView,
  TouchableWithoutFeedback, Keyboard, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';
import { listChatSessions, ChatSessionSummary } from '@/services/aiService';

const C = {
  primary: '#0D7B5F', // Deep emerald green matching mockups
  primaryBg: '#E6F4EA',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  bg: '#F8FAFC', // Soft light gray backdrop
  cardBg: '#FFFFFF',
  success: '#137333',
  warning: '#B45309',
  critical: '#C5221F',
};

function formatName(raw: string): string {
  if (!raw || /^[+\d\s\-()]{7,}$/.test(raw.trim())) return 'Rahul';
  const local = raw.includes('@') ? raw.split('@')[0] : raw;
  return local
    .split(/[._\-\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export default function AIHomeScreen() {
  const insets = useSafeAreaInsets();
  const { phone } = useAuth();
  const [userName, setUserName] = useState('Rahul');
  const [input, setInput] = useState('');
  const [recentChats, setRecentChats] = useState<ChatSessionSummary[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'Normal' | 'Watch' | 'Critical'>('Normal');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  // Load User Profile Name
  useEffect(() => {
    const cacheKey = `healthai_profile_name_${phone ?? 'guest'}`;
    AsyncStorage.getItem(cacheKey).then(name => {
      if (name && name.trim()) setUserName(name.trim());
      else setUserName(formatName(phone ?? 'Rahul'));
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

  const getStatusColor = (status: typeof healthStatus) => {
    switch (status) {
      case 'Normal':
        return { bg: '#E6F4EA', text: '#137333' };
      case 'Watch':
        return { bg: '#FEF3C7', text: '#B45309' };
      case 'Critical':
        return { bg: '#FCE8E6', text: '#C5221F' };
    }
  };

  const currentStatusColors = getStatusColor(healthStatus);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setStatusMenuOpen(false); }}>
          <View style={styles.mainContainer}>
            
            {/* Header: Title and Status Dropdown */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>AI Assistant ✨</Text>
                <Text style={styles.headerSubtitle}>Your intelligent health companion</Text>
              </View>
              
              <View style={styles.statusDropdownContainer}>
                <Pressable
                  style={[styles.statusBadge, { backgroundColor: currentStatusColors.bg }]}
                  onPress={() => setStatusMenuOpen(!statusMenuOpen)}
                >
                  <Text style={[styles.statusBadgeText, { color: currentStatusColors.text }]}>
                    {healthStatus}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={currentStatusColors.text} style={{ marginLeft: 4 }} />
                </Pressable>
                
                {statusMenuOpen && (
                  <View style={styles.statusMenu}>
                    {(['Normal', 'Watch', 'Critical'] as const).map(status => {
                      const colors = getStatusColor(status);
                      return (
                        <Pressable
                          key={status}
                          style={styles.statusMenuItem}
                          onPress={() => {
                            setHealthStatus(status);
                            setStatusMenuOpen(false);
                          }}
                        >
                          <View style={[styles.statusMenuDot, { backgroundColor: colors.text }]} />
                          <Text style={styles.statusMenuText}>{status}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              
              {/* Hello Welcome Banner Card */}
              <View style={styles.welcomeCard}>
                <Text style={styles.welcomeTitle}>Hello, {userName} 👋</Text>
                <Text style={styles.welcomeSubtitle}>How can I help with your health today?</Text>
              </View>

              {/* 2x2 Quick Actions Grid */}
              <View style={styles.grid}>
                {/* 1. Understand Reports */}
                <Pressable style={styles.gridCard} onPress={() => router.push('/upload')}>
                  <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="document-text" size={24} color="#7C3AED" />
                  </View>
                  <Text style={styles.gridCardLabel}>Understand reports</Text>
                </Pressable>

                {/* 2. Medicines Info */}
                <Pressable style={styles.gridCard} onPress={() => router.push('/(tabs)/medicines')}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FFE4E6' }]}>
                    <Ionicons name="medical" size={24} color="#E11D48" />
                  </View>
                  <Text style={styles.gridCardLabel}>Medicines info</Text>
                </Pressable>

                {/* 3. Symptom Checker */}
                <Pressable style={styles.gridCard} onPress={() => router.push('/symptom-checker')}>
                  <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="heart" size={24} color="#0284C7" />
                  </View>
                  <Text style={styles.gridCardLabel}>Symptom checker</Text>
                </Pressable>

                {/* 4. Health Tools */}
                <Pressable style={styles.gridCard} onPress={() => router.push('/health-tools')}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="apps" size={24} color="#D97706" />
                  </View>
                  <Text style={styles.gridCardLabel}>Health tools</Text>
                </Pressable>
              </View>

              {/* Recent Conversations Section */}
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
                            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0D7B5F" />
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
                    // Fallback preview items as seen in the mockup when no history exists
                    <>
                      <Pressable
                        style={styles.recentItem}
                        onPress={() => goToChat("Explain my blood test report")}
                      >
                        <View style={styles.chatIconBg}>
                          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0D7B5F" />
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
                          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0D7B5F" />
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
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  statusDropdownContainer: {
    position: 'relative',
    zIndex: 50,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusMenu: {
    position: 'absolute',
    top: 36,
    right: 0,
    width: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statusMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statusMenuDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  statusMenuText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },

  // Welcome Card
  welcomeCard: {
    backgroundColor: '#E6F4EA', // soft light green matching mockup
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(13, 123, 95, 0.1)',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0D7B5F',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#3B8873',
    fontWeight: '500',
  },

  // 2x2 Grid Layout
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },

  // Recent Section
  recentSection: {
    marginBottom: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllBtn: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D7B5F',
  },
  recentCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  chatIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  recentItemDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom Input Bar
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 48,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
