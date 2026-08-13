/**
 * useReports.ts  —  React hook for the Reports module
 *
 * All storage calls are scoped to the signed-in user's phone number so
 * reports from different users on the same device never mix.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { reportsApi, type ReportListItem } from '@/services/reportsApi';
import { useAuth } from '@/context/AuthContext';
import type { ReportCategory } from '@/types/Report/reportype';

export type FilterType = 'All' | ReportCategory;

export function useReports() {
  const { phone } = useAuth();

  const [allReports, setAllReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [filterDate, setFilterDate] = useState<Date | null>(null);

  const fetchReports = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await reportsApi.list(phone);
      setAllReports(data);
    } catch (e) {
      console.error('[useReports] fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [phone]);

  // Re-fetch whenever the logged-in user changes
  useEffect(() => { fetchReports(); }, [fetchReports]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchReports(true);
  }, [fetchReports]);

  const availableFilters = useMemo<FilterType[]>(() => {
    const cats = new Set<ReportCategory>();
    allReports.forEach(r => cats.add(r.category));
    const sorted = Array.from(cats).sort();
    return ['All', ...sorted];
  }, [allReports]);

  const filtered = useMemo(() => allReports.filter(r => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.labName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reportTypeFull.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'All' || r.category === activeFilter;
    const matchesDate = !filterDate || new Date(r.analyzedAt).toDateString() === filterDate.toDateString();
    return matchesSearch && matchesFilter && matchesDate;
  }), [allReports, searchQuery, activeFilter, filterDate]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allReports.length };
    allReports.forEach(r => {
      counts[r.category] = (counts[r.category] ?? 0) + 1;
    });
    return counts;
  }, [allReports]);

  const sections = useMemo(() => {
    const groups = new Map<string, ReportListItem[]>();
    filtered.forEach(r => {
      const d = new Date(r.analyzedAt);
      const title = isNaN(d.getTime())
        ? 'Unknown'
        : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups.has(title)) groups.set(title, []);
      groups.get(title)!.push(r);
    });
    return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
  }, [filtered]);

  const deleteReport = useCallback(async (id: string) => {
    try {
      await reportsApi.delete(id, phone);
      setAllReports(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error('[useReports] delete error', e);
      // Don't remove it from local state — the backend delete failed, so the
      // report still exists server-side. Silently dropping it from the list
      // here would desync the UI from reality until the next refresh.
      Alert.alert(
        'Delete Failed',
        'Could not delete this report. Please check your connection and try again.',
      );
    }
  }, [phone]);

  const [groupByMonth, setGroupByMonth] = useState(false);

  return {
    reports: filtered,
    sections,
    groupByMonth,
    setGroupByMonth,
    allReports,
    loading,
    refreshing,
    refresh,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    filterDate,
    setFilterDate,
    availableFilters,
    categoryCounts,
    deleteReport,
    refetch: () => fetchReports(true),
  };
}
