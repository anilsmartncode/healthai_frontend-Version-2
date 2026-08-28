/**
 * useMedicines.ts — Medicine Hub tab data
 */
import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import {
  getCategories,
  getRecentlyViewed,
  getTodaysReminders,
  getUserMedicines,
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
  const [savedMedicines, setSavedMedicines] = useState<Medicine[]>([]);
  const [todayReminders, setTodayReminders] = useState<Reminder[]>([]);
  const [todayBanner, setTodayBanner] = useState<TodayReminderBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let [cats, recent, reminders, saved] = await Promise.all([
        getCategories(),
        getRecentlyViewed(1, 5),
        getTodaysReminders(),
        getUserMedicines().catch((e) => {
          console.log('[useMedicines] getUserMedicines err', e);
          return [];
        }),
      ]);

      try {
        const deletedRaw = await AsyncStorage.getItem('DELETED_RECENT_MEDS');
        if (deletedRaw) {
          const deletedIds = JSON.parse(deletedRaw);
          recent = recent.filter(m => !deletedIds.includes(m.id));
        }
      } catch (e) {
        console.warn('Failed to load deleted recent meds', e);
      }

      setCategories(cats);
      setRecentlyViewed(recent);
      setTodayReminders(reminders);
      setSavedMedicines(saved);

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

  const removeRecentlyViewed = useCallback(async (id: string) => {
    setRecentlyViewed((prev) => prev.filter((m) => m.id !== id));

    const key = 'DELETED_RECENT_MEDS';
    try {
      const raw = await AsyncStorage.getItem(key);
      const deletedIds = raw ? JSON.parse(raw) : [];
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        await AsyncStorage.setItem(key, JSON.stringify(deletedIds));
      }
    } catch (e) {
      console.warn('Failed to save deleted recent med', e);
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
    savedMedicines,
    todayReminders,
    todayBanner,
    loading,
    error,
    refetch: fetchAll,
    removeRecentlyViewed,
  };
}
