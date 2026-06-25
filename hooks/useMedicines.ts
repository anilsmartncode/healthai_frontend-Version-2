/**
 * useMedicines.ts  —  React hook for the Medicine Hub tab
 *
 * Wraps services/Medicinesapi.ts the same way useReports.ts wraps
 * reportsApi.ts and useFamily.ts wraps familyApi.ts, so every top-level
 * tab follows the same data-fetching convention:
 *   screen → useXxx() hook → service layer → mock/real API
 *
 * Currently covers the data (tabs)/medicines.tsx needs on load:
 *   - categories
 *   - recently viewed medicines
 *   - today's reminders (collapsed into a single banner-friendly shape)
 *
 * Extend this hook (rather than calling Medicinesapi directly in screens)
 * as more medicine-tab screens are wired up.
 */

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  getCategories,
  getRecentlyViewed,
  getTodaysReminders,
  type Category,
  type Medicine,
} from '@/services/Medicinesapi';

export interface TodayReminderBanner {
  count: number;
  nextName: string;
  nextTime: string;
}

export function useMedicines() {
  const [categories, setCategories]     = useState<Category[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Medicine[]>([]);
  const [todayBanner, setTodayBanner]    = useState<TodayReminderBanner | null>(null);
  const [loading, setLoading]            = useState(true);
  const [error, setError]                = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, recent, todayReminders] = await Promise.all([
        getCategories(),
        getRecentlyViewed(1, 5),
        getTodaysReminders(),
      ]);

      setCategories(cats);
      setRecentlyViewed(recent);

      const upcoming = todayReminders.filter((r) => r.status === 'upcoming');
      if (todayReminders.length > 0) {
        setTodayBanner({
          count: upcoming.length,
          nextName: upcoming[0]?.medicineName ?? todayReminders[0].medicineName,
          nextTime: upcoming[0]?.time ?? todayReminders[0].time,
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

  // Re-fetch every time the tab comes into focus (mirrors the screen's
  // previous useFocusEffect behaviour, now centralized in the hook).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        if (active) await fetchAll();
      })();
      return () => { active = false; };
    }, [fetchAll]),
  );

  return {
    categories,
    recentlyViewed,
    todayBanner,
    loading,
    error,
    refetch: fetchAll,
  };
}
