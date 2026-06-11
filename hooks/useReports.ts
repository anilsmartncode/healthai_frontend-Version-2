/**
 * useReports.ts  —  React hook for the Reports module
 *
 * Provides: report list, loading, refresh, search, filter (category-based)
 * Backed by reportsApi (mock-first pattern).
 *
 * Filter chips are derived dynamically from actual report data so they
 * always reflect what the user has uploaded — no hardcoded list.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { reportsApi, type ReportListItem } from '@/services/reportsApi';
import type { ReportCategory } from '@/types/Report/reportype';

export type FilterType = 'All' | ReportCategory;

export function useReports() {
  const [allReports, setAllReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');

  const fetchReports = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await reportsApi.list();
      setAllReports(data);
    } catch (e) {
      console.error('[useReports] fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchReports(true);
  }, [fetchReports]);

  /**
   * Dynamic filter chips — derived from actual report categories present in data.
   * Always starts with 'All', then sorted unique categories from reports.
   */
  const availableFilters = useMemo<FilterType[]>(() => {
    const cats = new Set<ReportCategory>();
    allReports.forEach(r => cats.add(r.category));
    const sorted = Array.from(cats).sort();
    return ['All', ...sorted];
  }, [allReports]);

  // Filtering + search
  const filtered = useMemo(() => allReports.filter(r => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.labName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reportTypeFull.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === 'All' || r.category === activeFilter;

    return matchesSearch && matchesFilter;
  }), [allReports, searchQuery, activeFilter]);

  // Report counts per category — useful for showing badge on chip
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allReports.length };
    allReports.forEach(r => {
      counts[r.category] = (counts[r.category] ?? 0) + 1;
    });
    return counts;
  }, [allReports]);

  const deleteReport = useCallback(async (id: string) => {
    await reportsApi.delete(id);
    setAllReports(prev => prev.filter(r => r.id !== id));
  }, []);

  return {
    reports: filtered,
    allReports,
    loading,
    refreshing,
    refresh,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    availableFilters,
    categoryCounts,
    deleteReport,
    refetch: () => fetchReports(true),
  };
}
