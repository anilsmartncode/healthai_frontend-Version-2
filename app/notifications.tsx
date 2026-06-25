import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, Text, StyleSheet, View,
  Pressable, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, Radius, Spacing } from '@/constants/Colors';
import { useLang } from '@/context/Languagecontext';
import {
  getFamilyNotifications,
  markNotificationsRead,
  type FamilyNotification,
} from '@/services/familyApi';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ICON_MAP: Record<string, { icon: IoniconName; bg: string; color: string }> = {
  invite_accepted: { icon: 'person-add-outline',    bg: '#E1F5EE', color: Colors.primary  },
  invite_pending:  { icon: 'mail-outline',          bg: '#E6F1FB', color: '#185FA5'        },
  health_alert:    { icon: 'alert-circle-outline',  bg: '#FCEBEB', color: Colors.danger    },
  medicine_alert:  { icon: 'medkit-outline',        bg: '#FAEEDA', color: '#854F0B'        },
  report_ready:    { icon: 'document-text-outline', bg: '#E1F5EE', color: Colors.primary   },
  default:         { icon: 'notifications-outline', bg: Colors.surface, color: Colors.textMuted },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotifRow({ item, onPress }: { item: FamilyNotification; onPress: () => void }) {
  const cfg = ICON_MAP[item.type] ?? ICON_MAP.default;
  return (
    <Pressable
      style={[styles.row, !item.read && styles.rowUnread]}
      onPress={onPress}
    >
      {!item.read && <View style={styles.unreadDot} />}
      <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={20} color={cfg.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, !item.read && { fontWeight: '700' }]}>
          {item.title}
        </Text>
        {item.body ? <Text style={styles.rowBody}>{item.body}</Text> : null}
      </View>
      <Text style={styles.rowTime}>{timeAgo(item.created_at)}</Text>
    </Pressable>
  );
}

export default function Notifications() {
  const { t } = useLang();
  const [items,      setItems]      = useState<FamilyNotification[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unread,     setUnread]     = useState(0);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getFamilyNotifications();
      setItems(data.notifications);
      setUnread(data.unread_count);
    } catch (e) {
      console.error('[Notifications] load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePress = async (item: FamilyNotification) => {
    if (!item.read) {
      await markNotificationsRead([item.notif_id]);
      setItems(prev => prev.map(n => n.notif_id === item.notif_id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    }
    if (item.type === 'invite_pending')  router.push('/family/invitations');
    if (item.type === 'invite_accepted') router.push('/family');
    if (item.type === 'health_alert')    router.push('/family');
  };

  const markAllRead = async () => {
    const unreadIds = items.filter(n => !n.read).map(n => n.notif_id);
    if (!unreadIds.length) return;
    await markNotificationsRead(unreadIds);
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>{t('notif_title')}</Text>
        {unread > 0 && (
          <Pressable onPress={markAllRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true); }}
              tintColor={Colors.primary}
            />
          }
        >
          {items.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySub}>We'll let you know when something important happens.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {items.map(item => (
                <NotifRow key={item.notif_id} item={item} onPress={() => handlePress(item)} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.bg },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:    { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  title:      { flex: 1, fontSize: 17, fontWeight: '600', color: Colors.text },
  markAll:    { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  body:       { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: 40, flexGrow: 1 },
  list:       { gap: 8 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14, borderWidth: 1, borderColor: Colors.border },
  rowUnread:  { backgroundColor: '#F0FDF9', borderColor: '#9FE1CB' },
  unreadDot:  { position: 'absolute', top: 14, left: 6, width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary },
  iconWrap:   { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  rowTitle:   { fontSize: 14, fontWeight: '500', color: Colors.text },
  rowBody:    { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rowTime:    { fontSize: 11, color: Colors.textMuted, flexShrink: 0 },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  emptySub:   { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 24 },
});
