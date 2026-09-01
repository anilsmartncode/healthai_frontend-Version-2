/**
 * services/familyApi.ts
 * ─────────────────────────────────────────────────────────────────────
 * All API contracts for the Family feature (11 screens, 31 endpoints).
 *
 * HOW TO USE:
 *   • Every function has TWO blocks — 🔴 REAL (active) and 🟢 MOCK (commented)
 *   • 🔴 REAL calls the backend via medicineApiCall (auth + decrypt + logging)
 *   • Endpoint URLs come from ENDPOINTS in constants/api.ts
 *   • All family routes use BASE_URL + /api/api/family/... (double /api prefix)
 *     — same confirmed pattern as medicines and user/profile routes
 *
 * ⚠️  If a specific endpoint misbehaves, comment the REAL block and
 *     uncomment the MOCK block to fall back gracefully.
 * ─────────────────────────────────────────────────────────────────────
 */

import { ENDPOINTS } from '@/constants/api';
import { medicineApiCall } from './Medicineapiclient';
import {
  MOCK_DASHBOARD,
  MOCK_PENDING_INVITATIONS,
  MOCK_ACCEPTED_INVITATIONS,
  MOCK_TREE,
  DEFAULT_PERMISSIONS,
  MOCK_MEMBER_PROFILE,
  MOCK_NOTIFICATIONS,
  MOCK_AI_QUESTIONS,
} from './familyMockData';

// ── Network delay simulator (for mock blocks only) ────────────────────
const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms));

// ── Envelope unwrapper ────────────────────────────────────────────────
// Backend may wrap arrays as { members: [...] } or { data: [...] }.
// Same pattern used in Medicinesapi.ts — keeps callers safe from crashes.
function unwrapList<T>(raw: any, ...keys: string[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  for (const key of keys) {
    if (Array.isArray(raw?.[key])) return raw[key] as T[];
  }
  return [];
}

function sanitizeAvatarUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  let clean = String(url).trim();
  if (!clean) return undefined;
  if (clean.includes('localhost') || clean.includes('127.0.0.1')) {
    clean = clean.replace(/http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, 'https://healthai.smartncode.com');
  }
  if (clean.startsWith('http://healthai.smartncode.com')) {
    clean = clean.replace('http://', 'https://');
  }
  if (clean.startsWith('https://healthai.smartncode.com/uploads/')) {
    clean = clean.replace('https://healthai.smartncode.com/uploads/', 'https://healthai.smartncode.com/api/uploads/');
  } else if (clean.startsWith('http://healthai.smartncode.com/uploads/')) {
    clean = clean.replace('http://healthai.smartncode.com/uploads/', 'https://healthai.smartncode.com/api/uploads/');
  } else if (clean.startsWith('/uploads/')) {
    clean = `https://healthai.smartncode.com/api${clean}`;
  } else if (clean.startsWith('uploads/')) {
    clean = `https://healthai.smartncode.com/api/${clean}`;
  }
  return clean;
}

// ════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════

export type HealthStatus = 'Excellent' | 'Good' | 'Attention' | 'Critical';
export type InviteChannel = 'sms' | 'email' | 'link' | 'qr';
export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type NotifType = 'invite_accepted' | 'invite_pending' | 'health_alert' | 'report_ready';

export interface FamilyMember {
  member_id: string;
  name: string;
  relationship: string;
  health_score: number;
  status: HealthStatus;
  avatar_url?: string;
}

export interface FamilyDashboard {
  family_health_score: number;
  score_label: string;
  total_members: number;
  good_count: number;
  attention_count: number;
  critical_count: number;
  members: FamilyMember[];
  pending_invitations_count: number;
}

export interface Invitation {
  invite_id: string;
  name: string;
  relationship: string;
  invited_on: string;
  status: InviteStatus;
  channel: InviteChannel;
}

export interface FamilyTreeNode {
  member_id: string;
  name: string;
  relationship: string;
  health_score: number;
  status: HealthStatus;
  parent_ids: string[];
  children_ids: string[];
}

export interface MemberPermissions {
  view_reports: boolean;
  upload_reports: boolean;
  view_medicines: boolean;
  reminders: boolean;
  ai_insights: boolean;
  edit_medical: boolean;
  full_access: boolean;
  emergency: boolean;
}

export interface MemberProfile {
  member_id: string;
  name: string;
  relationship: string;
  date_of_birth: string;
  health_score: number;
  health_status: HealthStatus;
  last_report: string;
  active_medications: number;
  upcoming_appointments: number;
  ai_insights_count: number;
}

export interface FamilyNotification {
  notif_id: string;
  type: NotifType;
  title: string;
  read: boolean;
  created_at: string;
}

// ════════════════════════════════════════════════════════════════════════
// 1. FAMILY DASHBOARD
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/dashboard */
export async function getFamilyDashboard(): Promise<FamilyDashboard> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyDashboard);

  // Backend returns:
  // { success, message, data: { family, stats, members[], ai_insights, health_preview } }
  // We normalize this into the FamilyDashboard shape the UI expects.
  const d = raw?.data ?? raw;

  if (d?.stats !== undefined || d?.members !== undefined) {
    // ── New backend shape ─────────────────────────────────────────
    const stats = d.stats ?? {};
    const preview = d.health_preview ?? {};
    const members = d.members ?? [];

    // Map backend member shape → FamilyMember
    //   backend: { id, full_name, relationship, health_score?, health_status? }
    //   expected: { member_id, name, relationship, health_score, status }
    const mappedMembers: FamilyMember[] = members.map((m: any) => ({
      member_id: String(m.id ?? m.member_id ?? m.user_id),
      name: m.full_name ?? m.name ?? 'Member',
      relationship: m.relationship ?? 'Member',
      health_score: m.health_score ?? preview?.member_scores?.find((s: any) => s.member_id === m.id)?.health_score ?? 0,
      status: normalizeStatus(
        m.health_status
        ?? preview?.member_scores?.find((s: any) => s.member_id === m.id)?.health_status
      ),
      avatar_url: sanitizeAvatarUrl(m.profile_image ?? m.avatar_url),
    }));

    const memberScores = preview?.member_scores ?? [];
    const goodCount = memberScores.filter((s: any) => s.health_status === 'Good' || s.health_status === 'Excellent').length;
    const attentionCount = memberScores.filter((s: any) => s.health_status === 'Attention').length;
    const criticalCount = memberScores.filter((s: any) => s.health_status === 'Critical' || s.health_status === 'Poor').length;
    const familyScore = preview?.family_health_score ?? 0;

    return {
      family_health_score: familyScore,
      score_label: scoreLabelFromScore(familyScore),
      total_members: stats.total_members ?? mappedMembers.length,
      good_count: goodCount,
      attention_count: attentionCount,
      critical_count: criticalCount,
      members: mappedMembers,
      pending_invitations_count: stats.pending_invitations ?? 0,
    };
  }

  // ── Fallback: already correct shape ──────────────────────────────
  return d as FamilyDashboard;

  // 🟢 MOCK
  // await delay(700);
  // console.log('👨‍👩‍👧‍👦 [familyApi] getFamilyDashboard — MOCK');
  // return MOCK_DASHBOARD;
}

// ── Helpers for dashboard normalization ──────────────────────────────
function normalizeStatus(raw?: string): HealthStatus {
  if (!raw) return 'Good';
  const s = raw.toLowerCase();
  if (s === 'excellent') return 'Excellent';
  if (s === 'good') return 'Good';
  if (s === 'attention') return 'Attention';
  if (s === 'critical' || s === 'poor') return 'Critical';
  return 'Good';
}

function scoreLabelFromScore(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Attention Needed';
  return 'Needs Improvement';
}

/** GET /api/api/family/health-score/history?period=30d */
export async function getHealthScoreHistory(
  period: '30d' | '90d' | '1y' = '30d'
): Promise<{ period: string; data_points: { date: string; score: number }[] }> {
  // 🔴 REAL
  const url = `${ENDPOINTS.familyHealthHistory}?period=${period}`;
  const raw = await medicineApiCall<any>(url);
  return (raw?.data ?? raw) as { period: string; data_points: { date: string; score: number }[] };

  // 🟢 MOCK
  // await delay(500);
  // return {
  //   period,
  //   data_points: [
  //     { date: '2026-05-01', score: 79 },
  //     { date: '2026-05-08', score: 81 },
  //     { date: '2026-05-15', score: 80 },
  //     { date: '2026-05-22', score: 83 },
  //     { date: '2026-05-29', score: 82 },
  //     { date: '2026-06-05', score: 84 },
  //   ],
  // };
}

// ════════════════════════════════════════════════════════════════════════
// 2. ADD FAMILY MEMBER
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/member/search?phone=... */
export async function searchMemberByPhone(
  phone: string
): Promise<{ found: boolean; user?: { user_id: string; name: string; avatar_url?: string } }> {
  // 🔴 REAL
  const url = `${ENDPOINTS.familyMemberSearch}?phone=${encodeURIComponent(phone)}`;
  const raw = await medicineApiCall<any>(url);
  return (raw?.data ?? raw) as { found: boolean; user?: { user_id: string; name: string; avatar_url?: string } };

  // 🟢 MOCK
  // await delay(600);
  // console.log(`🔍 [familyApi] searchMemberByPhone phone=${phone} — MOCK`);
  // return { found: false };
}

/** POST /api/api/family/member/add-dependent */
export async function addDependentDirectly(payload: {
  relationship: string; full_name: string; phone: string; date_of_birth: string; blood_group?: string;
}): Promise<{ success: boolean; member_id: string; message: string }> {
  // 🔴 REAL
  const backendPayload = {
    ...payload,
    blood_group: payload.blood_group || null,
  };
  const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberAdd, {
    method: 'POST',
    body: backendPayload,
  });
  return (raw?.data ?? raw) as { success: boolean; member_id: string; message: string };

  // 🟢 MOCK
  // await delay(800);
  // console.log('➕ [familyApi] addDependentDirectly — MOCK', payload);
  // return { success: true, member_id: `mem_${Date.now()}`, message: 'Member added successfully' };
}

// ════════════════════════════════════════════════════════════════════════
// 3. INVITE MANAGEMENT
// ════════════════════════════════════════════════════════════════════════

/** POST /api/api/family/invite/send */
export async function sendInvite(payload: {
  relationship: string; full_name: string;
  channel: InviteChannel; phone?: string; email?: string; date_of_birth: string; blood_group?: string;
}): Promise<{ success: boolean; invite_id: string; expires_at: string; message: string }> {
  // 🔴 REAL
  const backendPayload = {
    relationship: payload.relationship,
    invitee_name: payload.full_name,
    invitee_phone: payload.phone || null,
    invitee_email: payload.email || null,
    date_of_birth: payload.date_of_birth,
    blood_group: payload.blood_group || null,
    invite_type: payload.channel,
    channel: payload.channel // send both for backwards compatibility
  };

  const raw = await medicineApiCall<any>(ENDPOINTS.familyInviteSend, {
    method: 'POST',
    body: backendPayload,
  });
  return (raw?.data ?? raw) as { success: boolean; invite_id: string; expires_at: string; message: string };

  // 🟢 MOCK
  // await delay(800);
  // console.log('📨 [familyApi] sendInvite — MOCK', payload);
  // return {
  //   success:    true,
  //   invite_id:  `inv_${Date.now()}`,
  //   expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  //   message:    `Invitation sent via ${payload.channel}`,
  // };
}

/** POST /api/api/family/invite/generate-link */
export async function generateInviteLink(payload: {
  relationship: string; full_name: string; date_of_birth: string; blood_group?: string;
}): Promise<{ invite_id: string; invite_code: string; invite_url: string; expires_at: string }> {
  // 🔴 REAL
  const backendPayload = {
    relationship: payload.relationship,
    invitee_name: payload.full_name,
    invitee_phone: null,
    invitee_email: null,
    date_of_birth: payload.date_of_birth,
    blood_group: payload.blood_group || null,
    invite_type: 'link'
  };

  const raw = await medicineApiCall<any>(ENDPOINTS.familyInviteGenerateLink, {
    method: 'POST',
    body: backendPayload,
  });
  const d = raw?.data ?? raw;
  return {
    invite_id: String(d.invite_id ?? d.id ?? ''),
    invite_code: d.invite_code ?? '',
    invite_url: d.invite_link ?? d.invite_url ?? '',
    expires_at: d.expires_at ?? ''
  };

  // 🟢 MOCK
  // await delay(600);
  // console.log('🔗 [familyApi] generateInviteLink — MOCK');
  // const code = 'HLTH' + Math.floor(1000 + Math.random() * 9000);
  // return {
  //   invite_id:   `inv_${Date.now()}`,
  //   invite_code: code,
  //   invite_url:  `https://healthai.ai/invite/${code}`,
  //   expires_at:  new Date(Date.now() + 7 * 86400000).toISOString(),
  // };
}

/** GET /api/api/family/invitations?status=pending|accepted|all */
export async function getInvitations(
  status: 'pending' | 'accepted' | 'all' = 'all'
): Promise<{ pending_count: number; accepted_count: number; invitations: Invitation[] }> {
  // 🔴 REAL
  const url = `${ENDPOINTS.familyInvitations}?status=${status}`;
  const raw = await medicineApiCall<any>(url);

  // The backend might nest under decrypted_data.data or just data
  const dataNode = raw?.decrypted_data?.data ?? raw?.data ?? raw;
  const sent = Array.isArray(dataNode?.sent) ? dataNode.sent : [];
  const received = Array.isArray(dataNode?.received) ? dataNode.received : [];
  const allRaw = [...sent, ...received];

  const invitations: Invitation[] = allRaw.map((b: any) => {
    let formattedDate = 'Unknown Date';
    if (b.created_at) {
      try {
        const d = new Date(b.created_at);
        formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch (e) {
        formattedDate = b.created_at;
      }
    }
    return {
      invite_id: String(b.id),
      name: b.invitee_name ?? 'Unknown',
      relationship: b.relationship ?? 'Member',
      invited_on: formattedDate,
      status: b.status ?? 'pending',
      channel: b.invite_type ?? 'link'
    };
  });

  return {
    pending_count: invitations.filter((i) => i.status === 'pending').length,
    accepted_count: invitations.filter((i) => i.status === 'accepted').length,
    invitations,
  };

  // 🟢 MOCK
  // await delay(600);
  // console.log(`📋 [familyApi] getInvitations status=${status} — MOCK`);
  // const all = [...MOCK_PENDING_INVITATIONS, ...MOCK_ACCEPTED_INVITATIONS];
  // const filtered =
  //   status === 'pending'  ? MOCK_PENDING_INVITATIONS :
  //   status === 'accepted' ? MOCK_ACCEPTED_INVITATIONS : all;
  // return {
  //   pending_count:  MOCK_PENDING_INVITATIONS.length,
  //   accepted_count: MOCK_ACCEPTED_INVITATIONS.length,
  //   invitations:    filtered,
  // };
}

/** POST /api/api/family/invite/{invite_id}/resend */
export async function resendInvitation(
  invite_id: string
): Promise<{ success: boolean; message: string; new_expires_at: string }> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyInviteResend(invite_id), {
    method: 'POST',
  });
  return (raw?.data ?? raw) as { success: boolean; message: string; new_expires_at: string };

  // 🟢 MOCK
  // await delay(600);
  // console.log(`🔄 [familyApi] resendInvitation id=${invite_id} — MOCK`);
  // return { success: true, message: 'Invitation resent', new_expires_at: new Date(Date.now() + 7 * 86400000).toISOString() };
}

/** DELETE /api/api/family/invite/{invite_id} */
export async function cancelInvitation(
  invite_id: string
): Promise<{ success: boolean; message: string }> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyInviteCancel(invite_id), {
    method: 'DELETE',
  });
  return (raw?.data ?? raw) as { success: boolean; message: string };

  // 🟢 MOCK
  // await delay(500);
  // console.log(`❌ [familyApi] cancelInvitation id=${invite_id} — MOCK`);
  // return { success: true, message: 'Invitation cancelled' };
}

// ════════════════════════════════════════════════════════════════════════
// 4. INVITE ACCEPTANCE (RECIPIENT SIDE)
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/invite/{invite_code}  (public — no auth needed) */
export async function getInviteDetails(invite_code: string): Promise<{
  invite_id: string; invited_by: string; relationship: string;
  expires_at: string; is_expired: boolean;
}> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyInviteDetails(invite_code));
  return (raw?.data ?? raw) as {
    invite_id: string; invited_by: string; relationship: string;
    expires_at: string; is_expired: boolean;
  };

  // 🟢 MOCK
  // await delay(600);
  // console.log(`🔍 [familyApi] getInviteDetails code=${invite_code} — MOCK`);
  // return { invite_id: 'inv_demo', invited_by: 'Surya', relationship: 'Mother',
  //   expires_at: new Date(Date.now() + 5 * 86400000).toISOString(), is_expired: false };
}

/** POST /api/api/family/invite/{invite_id}/accept */
export async function acceptInvitation(
  invite_id: string, id_token: string
): Promise<{ success: boolean; family_id: string; member_id: string; message: string }> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyInviteAccept(invite_id), {
    method: 'POST',
    body: { id_token },
  });
  return (raw?.data ?? raw) as { success: boolean; family_id: string; member_id: string; message: string };

  // 🟢 MOCK
  // await delay(800);
  // console.log(`✅ [familyApi] acceptInvitation id=${invite_id} — MOCK`);
  // return { success: true, family_id: 'fam1', member_id: `mem_${Date.now()}`, message: 'You have joined the family' };
}

/** POST /api/api/family/invite/{invite_id}/decline */
export async function declineInvitation(invite_id: string): Promise<{ success: boolean; message: string }> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyInviteDecline(invite_id), {
    method: 'POST',
  });
  return (raw?.data ?? raw) as { success: boolean; message: string };

  // 🟢 MOCK
  // await delay(500);
  // console.log('🚫 [familyApi] declineInvitation — MOCK');
  // return { success: true, message: 'Invitation declined' };
}

/** POST /api/auth/otp/send  (purpose=family_invite_verify) */
export async function sendOTP(phone: string): Promise<{ success: boolean; expires_in_seconds: number; message: string }> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyOtpSend, {
    method: 'POST',
    body: { phone, purpose: 'family_invite_verify' },
  });
  return (raw?.data ?? raw) as { success: boolean; expires_in_seconds: number; message: string };

  // 🟢 MOCK
  // await delay(700);
  // console.log(`📲 [familyApi] sendOTP phone=${phone} — MOCK`);
  // return { success: true, expires_in_seconds: 120, message: `OTP sent to ${phone}` };
}

/** POST /api/auth/otp/verify  (purpose=family_invite_verify) */
export async function verifyOTP(
  phone: string, otp_code: string
): Promise<{ valid: boolean; token?: string }> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyOtpVerify, {
    method: 'POST',
    body: { phone, otp_code, purpose: 'family_invite_verify' },
  });
  return (raw?.data ?? raw) as { valid: boolean; token?: string };

  // 🟢 MOCK
  // await delay(700);
  // console.log('🔐 [familyApi] verifyOTP — MOCK');
  // return { valid: true, token: `mock_token_${Date.now()}` };
}

// ════════════════════════════════════════════════════════════════════════
// 5. PERMISSIONS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/member/{member_id}/permissions */
export async function getMemberPermissions(
  member_id: string
): Promise<{ member_id: string; permissions: MemberPermissions }> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberPermissions(member_id));
  const rawPerms = raw?.data?.permissions ?? raw?.permissions ?? raw;

  const permissions: MemberPermissions = {
    view_reports: rawPerms.can_view_reports ?? rawPerms.view_reports ?? true,
    upload_reports: rawPerms.can_upload_reports ?? rawPerms.upload_reports ?? true,
    view_medicines: rawPerms.can_manage_medicines ?? rawPerms.view_medicines ?? true,
    reminders: rawPerms.can_manage_reminders ?? rawPerms.reminders ?? true,
    ai_insights: rawPerms.can_view_insights ?? rawPerms.ai_insights ?? true,
    edit_medical: rawPerms.can_edit_profile ?? rawPerms.edit_medical ?? true,
    full_access: rawPerms.full_access ?? false,
    emergency: rawPerms.emergency ?? true,
  };
  return { member_id, permissions };

  // 🟢 MOCK
  // await delay(500);
  // console.log(`🔑 [familyApi] getMemberPermissions id=${member_id} — MOCK`);
  // return { member_id, permissions: { ...DEFAULT_PERMISSIONS } };
}

/** PATCH /api/api/family/member/{member_id}/permissions */
export async function updateMemberPermissions(
  member_id: string, permissions: Partial<MemberPermissions>
): Promise<{ success: boolean; updated_permissions: MemberPermissions; message: string }> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberPermissions(member_id), {
    method: 'PATCH' as any,
    body: { permissions },
  });
  return (raw?.data ?? raw) as { success: boolean; updated_permissions: MemberPermissions; message: string };

  // 🟢 MOCK
  // await delay(600);
  // console.log(`🔑 [familyApi] updateMemberPermissions id=${member_id} — MOCK`);
  // return { success: true, updated_permissions: { ...DEFAULT_PERMISSIONS, ...permissions }, message: 'Permissions updated' };
}

// ════════════════════════════════════════════════════════════════════════
// 6. MEMBER PROFILE
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/member/{member_id}/profile */
export async function getMemberProfile(member_id: string): Promise<MemberProfile> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberProfile(member_id));
  const d = raw?.data ?? raw;

  if (d?.member || d?.health_summary) {
    const m = d.member ?? {};
    const hs = d.health_summary ?? {};
    return {
      member_id: String(m.id ?? m.member_id ?? member_id),
      name: m.full_name ?? m.name ?? 'Member',
      relationship: m.relationship ?? 'Member',
      date_of_birth: m.date_of_birth ?? 'Unknown',
      health_score: hs.health_score ?? 0,
      health_status: hs.health_status ?? 'Good',
      last_report: 'No reports',
      active_medications: hs.active_medications_count ?? 0,
      upcoming_appointments: hs.upcoming_appointments_count ?? 0,
      ai_insights_count: hs.ai_insights_count ?? 0,
    };
  }

  return (raw?.profile ?? d) as MemberProfile;

  // 🟢 MOCK
  // await delay(600);
  // console.log(`👤 [familyApi] getMemberProfile id=${member_id} — MOCK`);
  // return { ...MOCK_MEMBER_PROFILE, member_id };
}

/** DELETE /api/api/family/member/{member_id} */
export async function removeFamilyMember(member_id: string): Promise<{ success: boolean; message: string }> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyMemberRemove(member_id), {
    method: 'DELETE',
  });
  return (raw?.data ?? raw) as { success: boolean; message: string };

  // 🟢 MOCK
  // await delay(700);
  // console.log(`🗑️ [familyApi] removeFamilyMember id=${member_id} — MOCK`);
  // return { success: true, message: 'Member removed from family' };
}

// ════════════════════════════════════════════════════════════════════════
// 7. FAMILY TREE
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/tree */
export async function getFamilyTree(): Promise<{ family_id: string; tree: FamilyTreeNode[] }> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyTree);
  const tree = unwrapList<FamilyTreeNode>(raw, 'tree', 'members', 'data');
  return {
    family_id: raw?.family_id ?? 'unknown',
    tree,
  };

  // 🟢 MOCK
  // await delay(600);
  // console.log('🌳 [familyApi] getFamilyTree — MOCK');
  // return { family_id: 'fam1', tree: MOCK_TREE };
}

// ════════════════════════════════════════════════════════════════════════
// 8. AI FAMILY ASSISTANT
// ════════════════════════════════════════════════════════════════════════

/** POST /api/api/family/ai/query */
export async function askFamilyAI(
  question: string
): Promise<{ answer: string; confidence: number; generated_at: string }> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyAiQuery, {
    method: 'POST',
    body: { question },
  });
  return (raw?.data ?? raw) as { answer: string; confidence: number; generated_at: string };

  // 🟢 MOCK
  // await delay(1200);
  // console.log(`🤖 [familyApi] askFamilyAI — MOCK question="${question}"`);
  // return {
  //   answer:       "Mother (score 78) needs the most attention. She has 2 upcoming appointments and 3 active medications. Consider scheduling a check-up this week.",
  //   confidence:   0.92,
  //   generated_at: new Date().toISOString(),
  // };
}

/** GET /api/api/family/ai/suggested-questions */
export async function getAISuggestions(): Promise<{ suggestions: string[] }> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyAiSuggestions);
  const suggestions = unwrapList<string>(raw, 'suggestions', 'data');
  return { suggestions };

  // 🟢 MOCK
  // await delay(400);
  // console.log('💬 [familyApi] getAISuggestions — MOCK');
  // return { suggestions: MOCK_AI_QUESTIONS };
}

// ════════════════════════════════════════════════════════════════════════
// 9. NOTIFICATIONS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/api/family/notifications */
export async function getFamilyNotifications(): Promise<{
  unread_count: number; notifications: FamilyNotification[];
}> {
  // 🔴 REAL
  let mergedNotifications: FamilyNotification[] = [];
  let totalUnread = 0;

  try {
    const [familyRaw, globalRaw] = await Promise.allSettled([
      medicineApiCall<any>(ENDPOINTS.familyNotifications),
      medicineApiCall<any>(ENDPOINTS.globalNotifications)
    ]);

    if (familyRaw.status === 'fulfilled') {
      const fNotifs = unwrapList<FamilyNotification>(familyRaw.value, 'notifications', 'data');
      mergedNotifications = mergedNotifications.concat(fNotifs);
      totalUnread += (familyRaw.value?.unread_count ?? fNotifs.filter((n) => !n.read).length);
    } else {
      console.error('[getFamilyNotifications] Family API failed:', familyRaw.reason);
    }

    if (globalRaw.status === 'fulfilled') {
      const gNotifs = unwrapList<FamilyNotification>(globalRaw.value, 'notifications', 'data');
      mergedNotifications = mergedNotifications.concat(gNotifs);
      totalUnread += (globalRaw.value?.unread_count ?? gNotifs.filter((n) => !n.read).length);
    } else {
      console.error('[getFamilyNotifications] Global API failed:', globalRaw.reason);
    }
  } catch (e) {
    console.error('[getFamilyNotifications] Error fetching notifications:', e);
  }

  // Deduplicate by notif_id just in case
  const uniqueNotifs = Array.from(new Map(mergedNotifications.map(item => [item.notif_id, item])).values());

  // Sort by created_at descending (newest first)
  uniqueNotifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    unread_count: totalUnread,
    notifications: uniqueNotifs,
  };
}

export async function markNotificationsRead(
  notification_ids: string[]
): Promise<{ success: boolean; updated_count: number }> {
  // 🔴 REAL
  const raw = await medicineApiCall<any>(ENDPOINTS.familyNotificationsRead, {
    method: 'PATCH' as any,
    body: { notification_ids },
  });
  return (raw?.data ?? raw) as { success: boolean; updated_count: number };
}

/** PATCH /api/notifications/read-all (Global) */
export async function markAllGlobalNotificationsRead(): Promise<{ success: boolean; updated_count: number }> {
  try {
    const raw = await medicineApiCall<any>(ENDPOINTS.globalNotificationsReadAll, {
      method: 'PATCH' as any,
    });
    return (raw?.data ?? raw) as { success: boolean; updated_count: number };
  } catch (e) {
    console.error('[markAllGlobalNotificationsRead] API failed:', e);
    return { success: false, updated_count: 0 };
  }
}