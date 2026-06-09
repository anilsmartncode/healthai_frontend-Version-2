/**
 * familyApi.ts
 * ─────────────────────────────────────────────────────────────────────
 * All API contracts for the Family feature (11 screens, 31 endpoints).
 *
 * ⚠️  MOCK ONLY – every function returns mock data with a simulated
 *     network delay.  When the backend is ready:
 *       1. Remove the `await delay()` line
 *       2. Uncomment the real fetch() block
 *       3. Delete the mock return statement
 * ─────────────────────────────────────────────────────────────────────
 */

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

// ── Network delay simulator ───────────────────────────────────────────
const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms));

// ════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════

export type HealthStatus   = 'Excellent' | 'Good' | 'Attention' | 'Critical';
export type InviteChannel  = 'sms' | 'email' | 'link' | 'qr';
export type InviteStatus   = 'pending' | 'accepted' | 'declined' | 'expired';
export type NotifType      = 'invite_accepted' | 'invite_pending' | 'health_alert' | 'report_ready';

export interface FamilyMember {
  member_id:    string;
  name:         string;
  relationship: string;
  health_score: number;
  status:       HealthStatus;
  avatar_url?:  string;
}

export interface FamilyDashboard {
  family_health_score:       number;
  score_label:               string;
  total_members:             number;
  good_count:                number;
  attention_count:           number;
  critical_count:            number;
  members:                   FamilyMember[];
  pending_invitations_count: number;
}

export interface Invitation {
  invite_id:    string;
  name:         string;
  relationship: string;
  invited_on:   string;
  status:       InviteStatus;
  channel:      InviteChannel;
}

export interface FamilyTreeNode {
  member_id:    string;
  name:         string;
  relationship: string;
  health_score: number;
  status:       HealthStatus;
  parent_ids:   string[];
  children_ids: string[];
}

export interface MemberPermissions {
  view_reports:   boolean;
  upload_reports: boolean;
  view_medicines: boolean;
  reminders:      boolean;
  ai_insights:    boolean;
  edit_medical:   boolean;
  full_access:    boolean;
  emergency:      boolean;
}

export interface MemberProfile {
  member_id:             string;
  name:                  string;
  relationship:          string;
  date_of_birth:         string;
  health_score:          number;
  health_status:         HealthStatus;
  last_report:           string;
  active_medications:    number;
  upcoming_appointments: number;
  ai_insights_count:     number;
}

export interface FamilyNotification {
  notif_id:   string;
  type:       NotifType;
  title:      string;
  read:       boolean;
  created_at: string;
}

// ════════════════════════════════════════════════════════════════════════
// 1. FAMILY DASHBOARD
// ════════════════════════════════════════════════════════════════════════

/** GET /api/family/dashboard */
export async function getFamilyDashboard(): Promise<FamilyDashboard> {
  await delay(700);
  console.log('👨‍👩‍👧‍👦 [familyApi] getFamilyDashboard — MOCK');
  return MOCK_DASHBOARD;
  // Real:
  // const res = await fetch(`${BASE_URL}/api/family/dashboard`, { headers: authHeader() });
  // return res.json();
}

/** GET /api/family/health-score/history?period=30d */
export async function getHealthScoreHistory(
  period: '30d' | '90d' | '1y' = '30d'
): Promise<{ period: string; data_points: { date: string; score: number }[] }> {
  await delay(500);
  console.log(`📈 [familyApi] getHealthScoreHistory — MOCK period=${period}`);
  return {
    period,
    data_points: [
      { date: '2026-05-01', score: 79 },
      { date: '2026-05-08', score: 81 },
      { date: '2026-05-15', score: 80 },
      { date: '2026-05-22', score: 83 },
      { date: '2026-05-29', score: 82 },
      { date: '2026-06-05', score: 84 },
    ],
  };
}

// ════════════════════════════════════════════════════════════════════════
// 2. ADD FAMILY MEMBER
// ════════════════════════════════════════════════════════════════════════

/** GET /api/family/member/search?phone=... */
export async function searchMemberByPhone(
  phone: string
): Promise<{ found: boolean; user?: { user_id: string; name: string; avatar_url?: string } }> {
  await delay(600);
  console.log(`🔍 [familyApi] searchMemberByPhone phone=${phone} — MOCK`);
  return { found: false };
}

/** POST /api/family/member/add-dependent */
export async function addDependentDirectly(payload: {
  relationship: string; full_name: string; phone: string; date_of_birth: string;
}): Promise<{ success: boolean; member_id: string; message: string }> {
  await delay(800);
  console.log('➕ [familyApi] addDependentDirectly — MOCK', payload);
  return { success: true, member_id: `mem_${Date.now()}`, message: 'Member added successfully' };
}

// ════════════════════════════════════════════════════════════════════════
// 3. INVITE MANAGEMENT
// ════════════════════════════════════════════════════════════════════════

/** POST /api/family/invite/send */
export async function sendInvite(payload: {
  relationship: string; full_name: string;
  channel: InviteChannel; phone?: string; email?: string; date_of_birth: string;
}): Promise<{ success: boolean; invite_id: string; expires_at: string; message: string }> {
  await delay(800);
  console.log('📨 [familyApi] sendInvite — MOCK', payload);
  return {
    success:    true,
    invite_id:  `inv_${Date.now()}`,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    message:    `Invitation sent via ${payload.channel}`,
  };
}

/** POST /api/family/invite/generate-link */
export async function generateInviteLink(payload: {
  relationship: string; full_name: string; date_of_birth: string;
}): Promise<{ invite_id: string; invite_code: string; invite_url: string; expires_at: string }> {
  await delay(600);
  console.log('🔗 [familyApi] generateInviteLink — MOCK');
  const code = 'HLTH' + Math.floor(1000 + Math.random() * 9000);
  return {
    invite_id:  `inv_${Date.now()}`,
    invite_code: code,
    invite_url: `https://healthai.ai/invite/${code}`,
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  };
}

/** GET /api/family/invitations?status=pending|accepted|all */
export async function getInvitations(
  status: 'pending' | 'accepted' | 'all' = 'all'
): Promise<{ pending_count: number; accepted_count: number; invitations: Invitation[] }> {
  await delay(600);
  console.log(`📋 [familyApi] getInvitations status=${status} — MOCK`);
  const all = [...MOCK_PENDING_INVITATIONS, ...MOCK_ACCEPTED_INVITATIONS];
  const filtered =
    status === 'pending'  ? MOCK_PENDING_INVITATIONS :
    status === 'accepted' ? MOCK_ACCEPTED_INVITATIONS : all;
  return {
    pending_count:  MOCK_PENDING_INVITATIONS.length,
    accepted_count: MOCK_ACCEPTED_INVITATIONS.length,
    invitations:    filtered,
  };
}

/** POST /api/family/invite/{invite_id}/resend */
export async function resendInvitation(
  invite_id: string
): Promise<{ success: boolean; message: string; new_expires_at: string }> {
  await delay(600);
  console.log(`🔄 [familyApi] resendInvitation id=${invite_id} — MOCK`);
  return { success: true, message: 'Invitation resent', new_expires_at: new Date(Date.now() + 7 * 86400000).toISOString() };
}

/** DELETE /api/family/invite/{invite_id} */
export async function cancelInvitation(
  invite_id: string
): Promise<{ success: boolean; message: string }> {
  await delay(500);
  console.log(`❌ [familyApi] cancelInvitation id=${invite_id} — MOCK`);
  return { success: true, message: 'Invitation cancelled' };
}

// ════════════════════════════════════════════════════════════════════════
// 4. INVITE ACCEPTANCE (RECIPIENT SIDE)
// ════════════════════════════════════════════════════════════════════════

/** GET /api/family/invite/{invite_code}  (public) */
export async function getInviteDetails(invite_code: string): Promise<{
  invite_id: string; invited_by: string; relationship: string;
  expires_at: string; is_expired: boolean;
}> {
  await delay(600);
  console.log(`🔍 [familyApi] getInviteDetails code=${invite_code} — MOCK`);
  return { invite_id: 'inv_demo', invited_by: 'Surya', relationship: 'Mother',
    expires_at: new Date(Date.now() + 5 * 86400000).toISOString(), is_expired: false };
}

/** POST /api/family/invite/{invite_id}/accept */
export async function acceptInvitation(
  invite_id: string, otp_code: string
): Promise<{ success: boolean; family_id: string; member_id: string; message: string }> {
  await delay(800);
  console.log(`✅ [familyApi] acceptInvitation id=${invite_id} — MOCK`);
  return { success: true, family_id: 'fam1', member_id: `mem_${Date.now()}`, message: 'You have joined the family' };
}

/** POST /api/family/invite/{invite_id}/decline */
export async function declineInvitation(invite_id: string): Promise<{ success: boolean; message: string }> {
  await delay(500);
  console.log(`🚫 [familyApi] declineInvitation — MOCK`);
  return { success: true, message: 'Invitation declined' };
}

/** POST /api/auth/otp/send  purpose=family_invite_verify */
export async function sendOTP(phone: string): Promise<{ success: boolean; expires_in_seconds: number; message: string }> {
  await delay(700);
  console.log(`📲 [familyApi] sendOTP phone=${phone} — MOCK`);
  return { success: true, expires_in_seconds: 120, message: `OTP sent to ${phone}` };
}

/** POST /api/auth/otp/verify  purpose=family_invite_verify */
export async function verifyOTP(
  phone: string, otp_code: string
): Promise<{ valid: boolean; token?: string }> {
  await delay(700);
  console.log(`🔐 [familyApi] verifyOTP — MOCK`);
  return { valid: true, token: `mock_token_${Date.now()}` };
}

// ════════════════════════════════════════════════════════════════════════
// 5. PERMISSIONS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/family/member/{member_id}/permissions */
export async function getMemberPermissions(
  member_id: string
): Promise<{ member_id: string; permissions: MemberPermissions }> {
  await delay(500);
  console.log(`🔑 [familyApi] getMemberPermissions id=${member_id} — MOCK`);
  return { member_id, permissions: { ...DEFAULT_PERMISSIONS } };
}

/** PATCH /api/family/member/{member_id}/permissions */
export async function updateMemberPermissions(
  member_id: string, permissions: Partial<MemberPermissions>
): Promise<{ success: boolean; updated_permissions: MemberPermissions; message: string }> {
  await delay(600);
  console.log(`🔑 [familyApi] updateMemberPermissions id=${member_id} — MOCK`);
  return { success: true, updated_permissions: { ...DEFAULT_PERMISSIONS, ...permissions }, message: 'Permissions updated' };
}

// ════════════════════════════════════════════════════════════════════════
// 6. MEMBER PROFILE
// ════════════════════════════════════════════════════════════════════════

/** GET /api/family/member/{member_id}/profile */
export async function getMemberProfile(member_id: string): Promise<MemberProfile> {
  await delay(600);
  console.log(`👤 [familyApi] getMemberProfile id=${member_id} — MOCK`);
  return { ...MOCK_MEMBER_PROFILE, member_id };
}

/** DELETE /api/family/member/{member_id} */
export async function removeFamilyMember(member_id: string): Promise<{ success: boolean; message: string }> {
  await delay(700);
  console.log(`🗑️ [familyApi] removeFamilyMember id=${member_id} — MOCK`);
  return { success: true, message: 'Member removed from family' };
}

// ════════════════════════════════════════════════════════════════════════
// 7. FAMILY TREE
// ════════════════════════════════════════════════════════════════════════

/** GET /api/family/tree */
export async function getFamilyTree(): Promise<{ family_id: string; tree: FamilyTreeNode[] }> {
  await delay(600);
  console.log('🌳 [familyApi] getFamilyTree — MOCK');
  return { family_id: 'fam1', tree: MOCK_TREE };
}

// ════════════════════════════════════════════════════════════════════════
// 8. AI FAMILY ASSISTANT
// ════════════════════════════════════════════════════════════════════════

/** POST /api/family/ai/query */
export async function askFamilyAI(
  question: string
): Promise<{ answer: string; confidence: number; generated_at: string }> {
  await delay(1200);
  console.log(`🤖 [familyApi] askFamilyAI — MOCK question="${question}"`);
  return {
    answer:       "Mother (score 78) needs the most attention. She has 2 upcoming appointments and 3 active medications. Consider scheduling a check-up this week.",
    confidence:   0.92,
    generated_at: new Date().toISOString(),
  };
}

/** GET /api/family/ai/suggested-questions */
export async function getAISuggestions(): Promise<{ suggestions: string[] }> {
  await delay(400);
  console.log('💬 [familyApi] getAISuggestions — MOCK');
  return { suggestions: MOCK_AI_QUESTIONS };
}

// ════════════════════════════════════════════════════════════════════════
// 9. NOTIFICATIONS
// ════════════════════════════════════════════════════════════════════════

/** GET /api/family/notifications */
export async function getFamilyNotifications(): Promise<{
  unread_count: number; notifications: FamilyNotification[];
}> {
  await delay(500);
  console.log('🔔 [familyApi] getFamilyNotifications — MOCK');
  return { unread_count: MOCK_NOTIFICATIONS.filter((n) => !n.read).length, notifications: MOCK_NOTIFICATIONS };
}

/** PATCH /api/family/notifications/read */
export async function markNotificationsRead(
  notification_ids: string[]
): Promise<{ success: boolean; updated_count: number }> {
  await delay(400);
  return { success: true, updated_count: notification_ids.length };
}
