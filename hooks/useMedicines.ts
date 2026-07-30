/**
 * useMedicines.ts — Medicine Hub tab data
 */
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  getCategories,
  getRecentlyViewed,
  getTodaysReminders,
  type Category,
  type Medicine,
  type Reminder,
} from '@/services/Medicinesapi';

export interface TodayReminderBanner {
  count: number;
  nextName: string;
  nextTime: string;
}

export function useMedicines() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Medicine[]>([]);
  const [todayReminders, setTodayReminders] = useState<Reminder[]>([]);
  const [todayBanner, setTodayBanner] = useState<TodayReminderBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, recent, reminders] = await Promise.all([
        getCategories(),
        getRecentlyViewed(1, 5),
        getTodaysReminders(),
      ]);

      setCategories(cats);
      setRecentlyViewed(recent);
      setTodayReminders(reminders);

      const upcoming = reminders.filter((r) => r.status === 'upcoming');
      if (reminders.length > 0) {
        setTodayBanner({
          count: upcoming.length,
          nextName: upcoming[0]?.medicineName ?? reminders[0].medicineName,
          nextTime: upcoming[0]?.time ?? reminders[0].time,
        });
      } else {
        setTodayBanner(null);
      }
    } catch (e) {
      console.error('[useMedicines] fetch error', e);
      setError('Failed to load medicines data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (active) await fetchAll();
      })();
      return () => {
        active = false;
      };
    }, [fetchAll]),
  );

  return {
    categories,
    recentlyViewed,
    todayReminders,
    todayBanner,
    loading,
    error,
    refetch: fetchAll,
  };
}
