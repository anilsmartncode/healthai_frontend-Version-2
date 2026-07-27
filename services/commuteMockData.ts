/**
 * services/commuteMockData.ts
 * ─────────────────────────────────────────────────────────────────────
 * Centralised mock data for all Commute & Sleep tracking screens.
 * ⚠️  Remove / swap these once real APIs are wired in.
 * ─────────────────────────────────────────────────────────────────────
 */

import type {
  CommuteStatus,
  CommuteHistory,
  CommuteEvent,
  CommuteSegment,
  SleepDetails,
  SleepPhase,
  WeeklySleep,
  GeofenceZone,
  TrackingPermissionSet,
} from './commuteApi';

// ── Live Status ──────────────────────────────────────────────────────
export const MOCK_COMMUTE_STATUS: CommuteStatus = {
  member_id: 'mem2',
  member_name: 'Anil Kumar',
  current_zone: {
    zone_id: 'zone_office_001',
    type: 'office',
    label: 'Office',
  },
  status: 'at_zone',
  since: '2026-07-21T04:12:00Z',
  duration_minutes: 353,
  last_event: {
    event_id: 'evt_002',
    event_type: 'enter',
    location_type: 'office',
    zone_label: 'Office',
    timestamp: '2026-07-21T04:12:00Z',
  },
  is_tracking_active: true,
  last_seen: '2026-07-21T10:05:00Z',
};

// ── Commute History ──────────────────────────────────────────────────
export const MOCK_COMMUTE_EVENTS: CommuteEvent[] = [
  {
    event_id: 'evt_001',
    event_type: 'exit',
    location_type: 'home',
    zone_label: 'Home',
    timestamp: '2026-07-21T03:00:00Z',
  },
  {
    event_id: 'evt_002',
    event_type: 'enter',
    location_type: 'office',
    zone_label: 'Office',
    timestamp: '2026-07-21T04:12:00Z',
  },
  {
    event_id: 'evt_003',
    event_type: 'exit',
    location_type: 'office',
    zone_label: 'Office',
    timestamp: '2026-07-21T12:45:00Z',
  },
];

export const MOCK_COMMUTE_SEGMENTS: CommuteSegment[] = [
  {
    from_zone: 'Home',
    to_zone: 'Office',
    departure_time: '2026-07-21T03:00:00Z',
    arrival_time: '2026-07-21T04:12:00Z',
    duration_minutes: 72,
  },
];

export const MOCK_COMMUTE_HISTORY: CommuteHistory = {
  member_id: 'mem2',
  date: '2026-07-21',
  total_commute_duration_minutes: 72,
  total_events: 3,
  events: MOCK_COMMUTE_EVENTS,
  commute_segments: MOCK_COMMUTE_SEGMENTS,
};

// ── Sleep Details ────────────────────────────────────────────────────
export const MOCK_SLEEP_PHASES: SleepPhase[] = [
  { phase: 'deep',  duration_minutes: 70,  percentage: 15 },
  { phase: 'core',  duration_minutes: 185, percentage: 40 },
  { phase: 'rem',   duration_minutes: 115, percentage: 25 },
  { phase: 'awake', duration_minutes: 95,  percentage: 20 },
];

export const MOCK_WEEKLY_SLEEP: WeeklySleep[] = [
  { date: '2026-07-14', day: 'Mon', duration_minutes: 390 },
  { date: '2026-07-15', day: 'Tue', duration_minutes: 480 },
  { date: '2026-07-16', day: 'Wed', duration_minutes: 330 },
  { date: '2026-07-17', day: 'Thu', duration_minutes: 432 },
  { date: '2026-07-18', day: 'Fri', duration_minutes: 528 },
  { date: '2026-07-19', day: 'Sat', duration_minutes: 360 },
  { date: '2026-07-20', day: 'Sun', duration_minutes: 465 },
];

export const MOCK_SLEEP_DETAILS: SleepDetails = {
  member_id: 'mem2',
  date: '2026-07-20',
  summary: {
    total_duration_minutes: 465,
    quality: 'good',
    quality_score: 88,
    bedtime: '2026-07-20T17:45:00Z',
    wake_time: '2026-07-21T01:30:00Z',
    time_in_bed_minutes: 465,
    sleep_efficiency_percent: 88,
    avg_heart_rate_bpm: 62,
    avg_respiratory_rate: 14,
  },
  phases: MOCK_SLEEP_PHASES,
  weekly: MOCK_WEEKLY_SLEEP,
  comparison: {
    vs_yesterday_minutes: 15,
    vs_weekly_avg_minutes: -8,
  },
};

// ── Geofence Zones ───────────────────────────────────────────────────
export const MOCK_GEOFENCE_ZONES: GeofenceZone[] = [
  {
    zone_id: 'zone_home_001',
    type: 'home',
    label: 'Home',
    address: '42, 5th Cross, JP Nagar, Bangalore',
    latitude: 12.9716,
    longitude: 77.5946,
    radius_meters: 150,
    is_active: true,
    created_at: '2026-07-20T10:30:00Z',
    updated_at: '2026-07-20T10:30:00Z',
  },
  {
    zone_id: 'zone_office_001',
    type: 'office',
    label: 'Office',
    address: 'Tech Park, Whitefield, Bangalore',
    latitude: 12.9538,
    longitude: 77.6198,
    radius_meters: 150,
    is_active: true,
    created_at: '2026-07-20T10:30:00Z',
    updated_at: '2026-07-20T10:30:00Z',
  },
];

// ── Tracking Permissions ─────────────────────────────────────────────
export const MOCK_TRACKING_PERMISSIONS: TrackingPermissionSet = {
  member_id: 'mem2',
  permissions: {
    background_location: { granted: true,  required: true,  updated_at: '2026-07-20T10:00:00Z' },
    health_sync:         { granted: true,  required: true,  updated_at: '2026-07-20T10:00:00Z' },
    push_notifications:  { granted: false, required: false, updated_at: null },
    motion_fitness:      { granted: false, required: false, updated_at: null },
  },
  tracking_enabled: true,
  last_sync: '2026-07-21T07:05:00Z',
};
