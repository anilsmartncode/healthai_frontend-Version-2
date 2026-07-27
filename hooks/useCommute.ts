/**
 * hooks/useCommute.ts
 * ─────────────────────────────────────────────────────────────────────
 * Custom hooks wrapping commuteApi calls with loading / error state.
 * Each hook maps directly to a screen or feature area.
 * ─────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  CommuteStatus,
  CommuteHistory,
  SleepDetails,
  GeofenceZone,
  TrackingPermissionSet,
} from '@/services/commuteApi';
import {
  getCommuteStatus,
  getCommuteHistory,
  getSleepDetails,
  getGeofences,
  saveGeofences,
  getTrackingPermissions,
  updateTrackingPermissions,
} from '@/services/commuteApi';

// ── 1. Commute Status + Today's History ─────────────────────────────
export function useCommuteStatus(memberId: string) {
  const [status,  setStatus]  = useState<CommuteStatus | null>(null);
  const [history, setHistory] = useState<CommuteHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, h] = await Promise.all([
        getCommuteStatus(memberId),
        getCommuteHistory(memberId),
      ]);
      setStatus(s);
      setHistory(h);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load commute data');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => { load(); }, [load]);

  return { status, history, loading, error, refresh: load };
}

// ── 2. Sleep Details ────────────────────────────────────────────────
export function useSleepDetails(memberId: string, date?: string) {
  const [sleep,   setSleep]   = useState<SleepDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSleep(await getSleepDetails(memberId, date));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load sleep data');
    } finally {
      setLoading(false);
    }
  }, [memberId, date]);

  useEffect(() => { load(); }, [load]);

  return { sleep, loading, error, refresh: load };
}

// ── 3. Geofence Setup ───────────────────────────────────────────────
export function useGeofenceSetup(memberId: string) {
  const [zones,   setZones]   = useState<GeofenceZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getGeofences(memberId);
      setZones(res.zones);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load geofences');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (
    newZones: Omit<GeofenceZone, 'is_active' | 'created_at' | 'updated_at'>[],
  ) => {
    try {
      setSaving(true);
      setError(null);
      const res = await saveGeofences(memberId, newZones);
      setZones(res.zones);
      return true;
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save geofences');
      return false;
    } finally {
      setSaving(false);
    }
  }, [memberId]);

  return { zones, loading, saving, error, refresh: load, save };
}

// ── 4. Tracking Permissions ─────────────────────────────────────────
export function useTrackingPermissions(memberId: string) {
  const [permissions, setPermissions] = useState<TrackingPermissionSet | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setPermissions(await getTrackingPermissions(memberId));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => { load(); }, [load]);

  const toggle = useCallback(async (key: string, value: boolean) => {
    try {
      const updated = await updateTrackingPermissions(memberId, { [key]: value });
      setPermissions(updated);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update permission');
    }
  }, [memberId]);

  return { permissions, loading, error, refresh: load, toggle };
}
