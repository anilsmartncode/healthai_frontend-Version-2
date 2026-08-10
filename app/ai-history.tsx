/**
 * app/ai-history.tsx — AI Chat History
 * ─────────────────────────────────────────────────────────
 * Lists all saved conversations for the logged-in user.
 * Tapping a row reopens that conversation in /ai-chat.
 * Swipe-to-delete or use "Clear all" to remove sessions.
 * ─────────────────────────────────────────────────────────
 */

import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatTime } from '@/utils/format';
import {
  listChatSessions,
  deleteChatSession,
  clearAllChatSessions,
  type ChatSessionSummary,
} from '@/services/aiService';

export default function AIHistoryScreen() {
  const { phone } = useAuth();
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listChatSessions(phone)
      .then(setSessions)
      .catch((e) => {
        console.warn('[AIHistory] load failed', e);
        setError('Could not load history. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [phone]);

  // Reload every time this screen comes into focus (e.g. after a new chat)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (session: ChatSessionSummary) => {
    Alert.alert(
      'Delete conversation',
      `Remove "${session.title}" from your history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteChatSession(session.id, phone);
            setSessions(prev => prev.filter(s => s.id !== session.id));
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (sessions.length === 0) return;
    Alert.alert(
      'Clear all history',
      'This will permanently delete all your saved conversations. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: async () => {
            await clearAllChatSessions(phone);
            setSessions([]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/ai')}
          hitSlop={10}
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Chat History</Text>
        {sessions.length > 0 ? (
          <Pressable onPress={handleClearAll} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          </Pressable>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
          <Text style={styles.emptyTitle}>Oops!</Text>
          <Text style={styles.emptySub}>{error}</Text>
          <Pressable style={{ marginTop: 16, padding: 10, backgroundColor: Colors.primary, borderRadius: 8 }} onPress={load}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="time-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>Your chat history will appear here once you start a conversation with HealthAI.</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <SessionRow item={item} onPress={() => router.push({ pathname: '/ai-chat', params: { sessionId: item.id } })} onDelete={() => handleDelete(item)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function SessionRow({
  item, onPress, onDelete,
}: { item: ChatSessionSummary; onPress: () => void; onDelete: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <View style={styles.rowIcon}>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
        {item.preview ? (
          <Text style={styles.rowPreview} numberOfLines={1}>{item.preview}</Text>
        ) : null}
        <Text style={styles.rowMeta}>
          {formatDate(item.updatedAt)} · {formatTime(item.updatedAt)} · {item.messageCount} messages
        </Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={10} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  iconBtn: { padding: 4 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 8 },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },

  list: { padding: 16 },

  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  rowBody: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  rowPreview: { fontSize: 12, color: Colors.textMuted },
  rowMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  deleteBtn: { padding: 4 },
});
