import { useState, useEffect, useCallback } from 'react';
import { NotificationCenter } from '@/services/NotificationService';
import { FamilyNotificationProvider, MedicineNotificationProvider, ReportNotificationProvider } from '@/services/notificationProviders';
import { UnifiedNotification } from '@/types/notifications';

// Register providers once
NotificationCenter.registerProvider(FamilyNotificationProvider);
NotificationCenter.registerProvider(MedicineNotificationProvider);
NotificationCenter.registerProvider(ReportNotificationProvider);

export function useNotifications() {
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true); // start loading immediately

  const fetchAndSync = useCallback(async () => {
    setLoading(true);
    try {
      const sorted = await NotificationCenter.fetchAndMerge();
      setNotifications(sorted);
      setUnreadCount(NotificationCenter.getUnreadCount());
    } catch (e) {
      console.error('[useNotifications] Error syncing:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function initialize() {
      // 1. Await local persistence to avoid flicker
      await NotificationCenter.init();
      if (!mounted) return;

      // 2. Subscribe to global updates
      const unsubscribe = NotificationCenter.subscribe(() => {
        setNotifications(NotificationCenter.getSortedNotifications());
        setUnreadCount(NotificationCenter.getUnreadCount());
      });

      // 3. Serve cache immediately so UI feels instant
      setNotifications(NotificationCenter.getSortedNotifications());
      setUnreadCount(NotificationCenter.getUnreadCount());
      
      // 4. Sync with network silently in background
      await fetchAndSync();

      return unsubscribe;
    }
    
    let unsub = () => {};
    initialize().then(fn => { if (fn) unsub = fn; });
    
    return () => {
      mounted = false;
      unsub();
    };
  }, [fetchAndSync]);

  const markAllRead = useCallback(() => {
    NotificationCenter.markAllRead();
  }, []);

  const markAsRead = useCallback((id: string) => {
    NotificationCenter.markAsRead(id);
  }, []);

  const archive = useCallback((id: string) => {
    NotificationCenter.archive(id);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchAndSync,
    markAllRead,
    markAsRead,
    archive,
  };
}
