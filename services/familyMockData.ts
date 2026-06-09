/**
 * familyMockData.ts
 * ─────────────────────────────────────────────────────────────────────
 * Centralised mock data for all Family feature screens.
 * ⚠️  Remove / swap these once real APIs are wired in.
 * ─────────────────────────────────────────────────────────────────────
 */

import type {
  FamilyDashboard,
  FamilyMember,
  Invitation,
  FamilyTreeNode,
  MemberPermissions,
  MemberProfile,
  FamilyNotification,
} from './familyApi';

// ── Dashboard ────────────────────────────────────────────────────────
export const MOCK_MEMBERS: FamilyMember[] = [
  { member_id: 'mem1', name: 'Rajesh Kumar',  relationship: 'Father',   health_score: 82, status: 'Good' },
  { member_id: 'mem2', name: 'Sunita Kumar',  relationship: 'Mother',   health_score: 78, status: 'Attention' },
  { member_id: 'mem3', name: 'Arjun Kumar',   relationship: 'Son',      health_score: 90, status: 'Excellent' },
  { member_id: 'mem4', name: 'Priya Kumar',   relationship: 'Daughter', health_score: 88, status: 'Good' },
];

export const MOCK_DASHBOARD: FamilyDashboard = {
  family_health_score:     84,
  score_label:             'Excellent',
  total_members:           4,
  good_count:              3,
  attention_count:         1,
  critical_count:          0,
  members:                 MOCK_MEMBERS,
  pending_invitations_count: 2,
};

// ── Invitations ──────────────────────────────────────────────────────
export const MOCK_PENDING_INVITATIONS: Invitation[] = [
  { invite_id: 'inv1', name: 'Sunita Kumar',  relationship: 'Mother',   invited_on: '12 May 2026', status: 'pending',  channel: 'sms' },
  { invite_id: 'inv2', name: 'Arjun Kumar',   relationship: 'Son',      invited_on: '12 May 2026', status: 'pending',  channel: 'email' },
];

export const MOCK_ACCEPTED_INVITATIONS: Invitation[] = [
  { invite_id: 'inv3', name: 'Rajesh Kumar',  relationship: 'Father',   invited_on: '01 Apr 2026', status: 'accepted', channel: 'sms' },
  { invite_id: 'inv4', name: 'Priya Kumar',   relationship: 'Daughter', invited_on: '15 Apr 2026', status: 'accepted', channel: 'link' },
];

// ── Family tree ──────────────────────────────────────────────────────
export const MOCK_TREE: FamilyTreeNode[] = [
  { member_id: 'mem1', name: 'Rajesh Kumar',  relationship: 'Father',   health_score: 82, status: 'Good',      parent_ids: [],             children_ids: ['mem3', 'mem4'] },
  { member_id: 'mem2', name: 'Sunita Kumar',  relationship: 'Mother',   health_score: 78, status: 'Attention', parent_ids: [],             children_ids: ['mem3', 'mem4'] },
  { member_id: 'mem3', name: 'Arjun Kumar',   relationship: 'Son',      health_score: 90, status: 'Excellent', parent_ids: ['mem1','mem2'], children_ids: [] },
  { member_id: 'mem4', name: 'Priya Kumar',   relationship: 'Daughter', health_score: 88, status: 'Good',      parent_ids: ['mem1','mem2'], children_ids: [] },
];

// ── Permissions defaults ─────────────────────────────────────────────
export const DEFAULT_PERMISSIONS: MemberPermissions = {
  view_reports:   true,
  upload_reports: true,
  view_medicines: true,
  reminders:      true,
  ai_insights:    true,
  edit_medical:   false,
  full_access:    false,
  emergency:      true,
};

// ── Member profile ───────────────────────────────────────────────────
export const MOCK_MEMBER_PROFILE: MemberProfile = {
  member_id:            'mem2',
  name:                 'Sunita Kumar',
  relationship:         'Mother',
  date_of_birth:        '1970-03-22',
  health_score:         78,
  health_status:        'Attention',
  last_report:          'CBC Report',
  active_medications:   3,
  upcoming_appointments: 2,
  ai_insights_count:    2,
};

// ── Notifications ────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: FamilyNotification[] = [
  { notif_id: 'n1', type: 'invite_accepted', title: 'Rajesh Kumar joined your family',    read: true,  created_at: '2026-06-01T09:00:00Z' },
  { notif_id: 'n2', type: 'health_alert',    title: "Sunita Kumar's sugar level is high", read: false, created_at: '2026-06-07T08:00:00Z' },
  { notif_id: 'n3', type: 'invite_pending',  title: '2 invitations are still pending',   read: false, created_at: '2026-06-08T10:00:00Z' },
];

// ── AI suggested questions ───────────────────────────────────────────
export const MOCK_AI_QUESTIONS = [
  'Who needs attention?',
  'Compare family health',
  'Diabetes risk analysis',
  'Missed medications',
  'Vaccination status',
  'Generate family report',
];
