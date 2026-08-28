import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ScrollView, Text, StyleSheet, View,
  Pressable, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Spacing } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';
import { useNotifications } from '@/hooks/useNotifications';
import { UnifiedNotification, NotificationCategory } from '@/types/notifications';
import {
  getFamilyNotifications,
  markNotificationsRead,
  markAllGlobalNotificationsRead,
  type FamilyNotification,
} from '@/services/familyApi';

const CATEGORIES: { id: NotificationCategory | 'all', label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'report', label: 'Reports' },
  { id: 'medicine', label: 'Medicines' },
  { id: 'family', label: 'Family' },
];

const ICON_MAP: Record<string, { icon: any; bg: string; color: string }> = {
  report: { icon: 'document-text-outline', bg: '#FCEBEB', color: Colors.danger },
  medicine: { icon: 'medkit-outline', bg: '#FAEEDA', color: '#854F0B' },
  family: { icon: 'people-outline', bg: '#E1F5EE', color: Colors.primary },
  system: { icon: 'information-circle-outline', bg: Colors.surface, color: Colors.textMuted },
  
  // API specific icons
  invite_accepted: { icon: 'person-add-outline', bg: '#E1F5EE', color: Colors.primary },
  invite_pending: { icon: 'mail-outline', bg: '#E6F1FB', color: '#185FA5' },
  health_alert: { icon: 'alert-circle-outline', bg: '#FCEBEB', color: Colors.danger },
  medicine_alert: { icon: 'medkit-outline', bg: '#FAEEDA', color: '#854F0B' },
  report_ready: { icon: 'document-text-outline', bg: '#E1F5EE', color: Colors.primary },
  health_tip: { icon: 'bulb-outline', bg: '#FFF4E5', color: '#D97706' },
  default: { icon: 'notifications-outline', bg: Colors.surface, color: Colors.textMuted },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotifRow({ item, onPress }: { item: UnifiedNotification; onPress: () => void }) {
  const { rowDirection, textAlign } = useLang();
  // If it's from the API, we can use the original type for a better icon match
  const originalApiItem = item.payload?.originalApiItem as FamilyNotification | undefined;
  const cfgKey = originalApiItem?.type || item.category;
  const cfg = ICON_MAP[cfgKey] ?? ICON_MAP.system ?? ICON_MAP.default;
  
  const isUnread = item.status === 'unread';
  const isArchived = item.status === 'archived';
  return (
    <Pressable
      style={[styles.row, { flexDirection: rowDirection }, isUnread && styles.rowUnread, isArchived && { opacity: 0.5 }]}
      onPress={onPress}
    >
      {isUnread && <View style={styles.unreadDot} />}
      <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={20} color={cfg.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { textAlign }, isUnread && { fontWeight: '700' }]}>
          {item.title}
        </Text>
        {item.message ? <Text style={[styles.rowBody, { textAlign }]}>{item.message}</Text> : null}
      </View>
      <Text style={styles.rowTime}>{timeAgo(item.timestamp)}</Text>
    </Pressable>
  );
}

export default function Notifications() {
  const { t, isRTL, rowDirection, textAlign } = useLang();
  
  // 1. Hook Notifications
  const { notifications: hookNotifications, loading: hookLoading, refresh, unreadCount, markAllRead, markAsRead } = useNotifications();
  
  // 2. API Notifications
  const [apiItems, setApiItems] = useState<FamilyNotification[]>([]);
  const [apiUnread, setApiUnread] = useState(0);
  const [apiLoading, setApiLoading] = useState(true);

  const loadApi = useCallback(async () => {
    try {
      const data = await getFamilyNotifications();
      setApiItems(data.notifications || []);
      setApiUnread(data.unread_count || 0);
    } catch (err) {
      console.log('Error loading API notifications', err);
    } finally {
      setApiLoading(false);
    }
  }, []);

  useEffect(() => { loadApi(); }, [loadApi]);

  const [filter, setFilter] = useState<NotificationCategory | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Merge hook and API notifications
  const allNotifications = useMemo(() => {
    const mappedApiItems: UnifiedNotification[] = apiItems.map(item => {
      const type = item.type as string;
      let cat: NotificationCategory = 'system';
      if (type === 'report_ready' || type === 'report') cat = 'report';
      else if (type === 'medicine_alert' || type === 'medicine') cat = 'medicine';
      else if (type === 'invite_pending' || type === 'invite_accepted' || type === 'health_alert' || type === 'family') cat = 'family';

      let route: any = undefined;
      if (type === 'report_ready' || type === 'report') route = '/reports';
      else if (type === 'invite_pending') route = '/family/join';
      else if (type === 'invite_accepted' || type === 'health_alert' || type === 'health_tip') route = '/family';
      else if (type === 'medicine_alert' || type === 'medicine') route = '/medicines';

      return {
        id: `api_${item.notif_id}`,
        title: item.title,
        message: (item as any).message || '',
        category: cat,
        priority: 'MEDIUM',
        status: item.read ? 'read' : 'unread',
        timestamp: item.created_at,
        action: { type: 'navigate', route },
        payload: { originalApiItem: item }
      };
    });

    // Merge and sort by timestamp
    const combined = [...hookNotifications, ...mappedApiItems];
    return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [hookNotifications, apiItems]);

  const filteredItems = allNotifications.filter(n => filter === 'all' || n.category === filter);
  const totalUnread = unreadCount + apiUnread;
  const isLoading = hookLoading || apiLoading;

  const handlePress = async (item: UnifiedNotification) => {
    // Handle Hook mark as read
    if (!item.id.startsWith('api_')) {
      markAsRead(item.id);
    }
    
    // Handle API mark as read
    const apiItem = item.payload?.originalApiItem as FamilyNotification | undefined;
    if (apiItem && !apiItem.read) {
      await markNotificationsRead([apiItem.notif_id]);
      setApiItems(prev => prev.map(n => n.notif_id === apiItem.notif_id ? { ...n, read: true } : n));
      setApiUnread(prev => Math.max(0, prev - 1));
    }

    // Navigation
    if (item.action.type === 'navigate' && item.action.route) {
      if (item.action.params) {
        router.push({ pathname: item.action.route, params: item.action.params });
      } else {
        router.push(item.action.route as any);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), loadApi()]);
    setRefreshing(false);
  };

  const handleMarkAllRead = async () => {
    markAllRead(); // Hook
    const unreadIds = apiItems.filter(n => !n.read).map(n => n.notif_id);
    if (unreadIds.length > 0) {
      await Promise.all([
        markNotificationsRead(unreadIds),
        markAllGlobalNotificationsRead()
      ]);
      setApiItems(prev => prev.map(n => ({ ...n, read: true })));
      setApiUnread(0);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.header, { flexDirection: rowDirection }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={20} color={Colors.text} />
        </Pressable>
        <Text style={[styles.title, { textAlign }]}>{t('notifications')}</Text>
        {totalUnread > 0 && (
          <Pressable onPress={handleMarkAllRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {/* Category Filters */}
      <View style={styles.filterOuter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterContainer, { flexDirection: rowDirection }]}>
          {CATEGORIES.map(c => (
             <Pressable 
               key={c.id} 
               style={[styles.filterTab, filter === c.id && styles.filterTabActive]}
               onPress={() => setFilter(c.id)}
             >
               <Text style={[styles.filterText, filter === c.id && styles.filterTextActive]}>{c.label}</Text>
             </Pressable>
          ))}
        </ScrollView>
      </View>

      {isLoading && allNotifications.length === 0 ? (
        <ActivityIndicator style={{ flex: 1, marginTop: 40 }} size="large" color={Colors.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {filteredItems.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={Colors.border} />
              <Text style={[styles.emptyTitle, { textAlign }]}>No notifications yet</Text>
              <Text style={[styles.emptySub, { textAlign }]}>We&apos;ll let you know when something important happens.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filteredItems.map(item => (
                <NotifRow key={item.id} item={item} onPress={() => handlePress(item)} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  title: { flex: 1, fontSize: 17, fontWeight: '600', color: Colors.text },
  markAll: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  
  filterOuter: { paddingVertical: 10, borderBottomWidth: 1, borderColor: Colors.border },
  filterContainer: { paddingHorizontal: 16, gap: 8 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: Colors.border },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  filterTextActive: { color: '#FFFFFF' },

  body: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 40, flexGrow: 1 },
  list: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14, borderWidth: 1, borderColor: Colors.border },
  rowUnread: { backgroundColor: '#F0FDF9', borderColor: '#9FE1CB' },
  unreadDot: { position: 'absolute', top: 14, left: 6, width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary },
  iconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  rowHeader: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '500', color: Colors.text },
  rowBody: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rowTime: { fontSize: 11, color: Colors.textMuted, flexShrink: 0 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 24 },
});
