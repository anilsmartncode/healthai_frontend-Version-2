/**
 * services/commuteApi.ts
 * ─────────────────────────────────────────────────────────────────────
 * All API contracts for the Activity & Commute Tracker feature.
 *
 * HOW TO USE:
 *   • Every function has TWO blocks — 🟢 MOCK (active) and 🔴 REAL (commented)
 *   • 🔴 REAL calls the backend via medicineApiCall (auth + decrypt + logging)
 *   • Endpoint URLs come from ENDPOINTS in constants/api.ts
 *   • All commute routes use BASE_URL + /api/api/family/... (double /api prefix)
 *
 * ⚠️  Once the backend delivers these endpoints, comment the MOCK block
 *     and uncomment the REAL block in each function.
 * ─────────────────────────────────────────────────────────────────────
 */

import { ENDPOINTS } from '@/constants/api';
import { medicineApiCall } from './Medicineapiclient';
import {
  MOCK_COMMUTE_STATUS,
  MOCK_COMMUTE_HISTORY,
  MOCK_SLEEP_DETAILS,
  MOCK_GEOFENCE_ZONES,
  MOCK_TRACKING_PERMISSIONS,
} from './commuteMockData';

// ── Network delay simulator (for mock blocks only) ────────────────────
const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms));

// ════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════

export type ZoneType = 'home' | 'office' | 'custom';
export type EventType = 'exit' | 'enter';
export type MemberStatus = 'at_zone' | 'in_transit' | 'unknown';
export type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type SleepPhaseName = 'deep' | 'core' | 'rem' | 'awake';

export interface GeofenceZone {
  zone_id: string;
  type: ZoneType;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommuteEvent {
  event_id: string;
  event_type: EventType;
  location_type: ZoneType;
  zone_label: string;
  timestamp: string;
}

export interface CommuteSegment {
  from_zone: string;
  to_zone: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
}

export interface CommuteStatus {
  member_id: string;
  member_name: string;
  current_zone: {
    zone_id: string;
    type: ZoneType;
    label: string;
  } | null;
  status: MemberStatus;
  since: string;
  duration_minutes: number;
  last_event: CommuteEvent | null;
  is_tracking_active: boolean;
  last_seen: string;
}

export interface CommuteHistory {
  member_id: string;
  date: string;
  total_commute_duration_minutes: number;
  total_events: number;
  events: CommuteEvent[];
  commute_segments: CommuteSegment[];
}

export interface SleepPhase {
  phase: SleepPhaseName;
  duration_minutes: number;
  percentage: number;
}

export interface WeeklySleep {
  date: string;
  day: string;
  duration_minutes: number;
}

export interface SleepDetails {
  member_id: string;
  date: string;
  summary: {
    total_duration_minutes: number;
    quality: SleepQuality;
    quality_score: number;
    bedtime: string;
    wake_time: string;
    time_in_bed_minutes: number;
    sleep_efficiency_percent: number;
    avg_heart_rate_bpm: number;
    avg_respiratory_rate: number;
  };
  phases: SleepPhase[];
  weekly: WeeklySleep[];
  comparison: {
    vs_yesterday_minutes: number;
    vs_weekly_avg_minutes: number;
  };
}

export interface TrackingPermission {
  granted: boolean;
  required: boolean;
  updated_at: string | null;
}

export interface TrackingPermissionSet {
  member_id: string;
  permissions: {
    background_location: TrackingPermission;
    health_sync: TrackingPermission;
    push_notifications: TrackingPermission;
    motion_fitness: TrackingPermission;
  };
  tracking_enabled: boolean;
  last_sync: string | null;
}

export interface HealthDataPayload {
  source: 'apple_health' | 'health_connect';
  sync_date: string;
  metrics: {
    sleep?: {
      total_duration_seconds: number;
      bedtime: string;
      wake_time: string;
      phases?: { phase: SleepPhaseName; duration_seconds: number }[];
    };
    steps?: {
      count: number;
      distance_meters?: number;
    };
    heart_rate?: {
      resting_bpm: number;
      average_bpm?: number;
      min_bpm?: number;
      max_bpm?: number;
    };
    respiratory_rate?: {
      average_brpm: number;
    };
  };
}

// ════════════════════════════════════════════════════════════════════════
// 1. COMMUTE — LIVE STATUS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/member/:memberId/commute/status */
export async function getCommuteStatus(memberId: string): Promise<CommuteStatus> {
  // 🟢 MOCK
  await delay(500);
  console.log('🚗 [commuteApi] getCommuteStatus — MOCK');
  return { ...MOCK_COMMUTE_STATUS, member_id: memberId };

  // 🔴 REAL
  // const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberCommuteStatus(memberId));
  // return raw?.data ?? raw;
}

// ════════════════════════════════════════════════════════════════════════
// 2. COMMUTE — HISTORY
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/member/:memberId/commute/history?date=YYYY-MM-DD */
export async function getCommuteHistory(
  memberId: string,
  date?: string,
): Promise<CommuteHistory> {
  // 🟢 MOCK
  await delay(600);
  console.log('🚗 [commuteApi] getCommuteHistory — MOCK');
  return {
    ...MOCK_COMMUTE_HISTORY,
    member_id: memberId,
    date: date ?? new Date().toISOString().split('T')[0],
  };

  // 🔴 REAL
  // const qs = date ? `?date=${date}` : '';
  // const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberCommuteHistory(memberId) + qs);
  // return raw?.data ?? raw;
}

// ════════════════════════════════════════════════════════════════════════
// 3. SLEEP — DETAILS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/member/:memberId/sleep?date=YYYY-MM-DD */
export async function getSleepDetails(
  memberId: string,
  date?: string,
): Promise<SleepDetails> {
  // 🟢 MOCK
  await delay(600);
  console.log('🌙 [commuteApi] getSleepDetails — MOCK');
  return {
    ...MOCK_SLEEP_DETAILS,
    member_id: memberId,
    date: date ?? MOCK_SLEEP_DETAILS.date,
  };

  // 🔴 REAL
  // const qs = date ? `?date=${date}` : '';
  // const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberSleep(memberId) + qs);
  // return raw?.data ?? raw;
}

// ════════════════════════════════════════════════════════════════════════
// 4. HEALTH DATA — SYNC (device → server)
// ════════════════════════════════════════════════════════════════════════

/** POST /api/api/user/health-data */
export async function syncHealthData(
  payload: HealthDataPayload,
): Promise<{ success: boolean; sync_id: string; synced_at: string }> {
  // 🟢 MOCK
  await delay(500);
  console.log('💓 [commuteApi] syncHealthData — MOCK');
  return {
    success: true,
    sync_id: 'sync_mock_001',
    synced_at: new Date().toISOString(),
  };

  // 🔴 REAL
  // const raw = await medicineApiCall<any>(ENDPOINTS.healthDataSync, {
  //   method: 'POST',
  //   body: payload,
  // });
  // return raw?.data ?? raw;
}

// ════════════════════════════════════════════════════════════════════════
// 5. GEOFENCE — GET ZONES
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/member/:memberId/geofences */
export async function getGeofences(
  memberId: string,
): Promise<{ member_id: string; zones: GeofenceZone[] }> {
  // 🟢 MOCK
  await delay(500);
  console.log('📍 [commuteApi] getGeofences — MOCK');
  return { member_id: memberId, zones: [...MOCK_GEOFENCE_ZONES] };

  // 🔴 REAL
  // const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberGeofences(memberId));
  // return raw?.data ?? raw;
}

// ════════════════════════════════════════════════════════════════════════
// 6. GEOFENCE — SAVE ZONES
// ════════════════════════════════════════════════════════════════════════

/** POST /api/api/family/member/:memberId/geofences */
export async function saveGeofences(
  memberId: string,
  zones: Omit<GeofenceZone, 'is_active' | 'created_at' | 'updated_at'>[],
): Promise<{ member_id: string; zones: GeofenceZone[] }> {
  // 🟢 MOCK
  await delay(800);
  console.log('📍 [commuteApi] saveGeofences — MOCK');
  const now = new Date().toISOString();
  const saved: GeofenceZone[] = zones.map((z) => ({
    ...z,
    is_active: true,
    created_at: now,
    updated_at: now,
  }));
  return { member_id: memberId, zones: saved };

  // 🔴 REAL
  // const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberGeofences(memberId), {
  //   method: 'POST',
  //   body: { zones },
  // });
  // return raw?.data ?? raw;
}

// ════════════════════════════════════════════════════════════════════════
// 7. TRACKING PERMISSIONS — GET
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/member/:memberId/tracking-permissions */
export async function getTrackingPermissions(
  memberId: string,
): Promise<TrackingPermissionSet> {
  // 🟢 MOCK
  await delay(400);
  console.log('🛡️ [commuteApi] getTrackingPermissions — MOCK');
  return { ...MOCK_TRACKING_PERMISSIONS, member_id: memberId };

  // 🔴 REAL
  // const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberTrackingPermissions(memberId));
  // return raw?.data ?? raw;
}

// ════════════════════════════════════════════════════════════════════════
// 8. TRACKING PERMISSIONS — UPDATE
// ════════════════════════════════════════════════════════════════════════

/** PUT /api/api/family/member/:memberId/tracking-permissions */
export async function updateTrackingPermissions(
  memberId: string,
  permissions: Record<string, boolean>,
): Promise<TrackingPermissionSet> {
  // 🟢 MOCK
  await delay(500);
  console.log('🛡️ [commuteApi] updateTrackingPermissions — MOCK');
  const now = new Date().toISOString();
  const base = { ...MOCK_TRACKING_PERMISSIONS, member_id: memberId };
  for (const [key, val] of Object.entries(permissions)) {
    if (key in base.permissions) {
      (base.permissions as any)[key] = {
        ...(base.permissions as any)[key],
        granted: val,
        updated_at: val ? now : null,
      };
    }
  }
  return base;

  // 🔴 REAL
  // const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberTrackingPermissions(memberId), {
  //   method: 'PUT',
  //   body: { permissions },
  // });
  // return raw?.data ?? raw;
}
