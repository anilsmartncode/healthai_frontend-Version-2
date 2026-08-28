/**
 * useFamily.ts
 * ─────────────────────────────────────────────────────────────────────
 * Custom hooks wrapping familyApi calls with loading / error state.
 * Each hook maps directly to a screen or feature area.
 * ─────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  FamilyDashboard, Invitation, FamilyTreeNode,
  MemberProfile, MemberPermissions,
} from '@/services/familyApi';
import {
  getFamilyDashboard,
  getInvitations,
  getFamilyTree,
  getMemberProfile,
  getMemberPermissions,
  updateMemberPermissions,
  removeFamilyMember,
  cancelInvitation,
  resendInvitation,
  askFamilyAI,
  getAISuggestions,
} from '@/services/familyApi';

// ── 1. Dashboard ─────────────────────────────────────────────────────
export function useFamilyDashboard() {
  const [dashboard, setDashboard] = useState<FamilyDashboard | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setDashboard(await getFamilyDashboard());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load family data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { dashboard, loading, error, refresh: load };
}

// ── 2. Invitations ───────────────────────────────────────────────────
export function useInvitations() {
  const [pending,  setPending]  = useState<Invitation[]>([]);
  const [accepted, setAccepted] = useState<Invitation[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getInvitations('all');
      setPending(data.invitations.filter((i) => i.status === 'pending'));
      setAccepted(data.invitations.filter((i) => i.status === 'accepted'));
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleResend = useCallback(async (invite_id: string) => {
    await resendInvitation(invite_id);
    load();
  }, [load]);

  const handleCancel = useCallback(async (invite_id: string) => {
    await cancelInvitation(invite_id);
    load();
  }, [load]);

  return { pending, accepted, loading, error, refresh: load, handleResend, handleCancel };
}

// ── 3. Family Tree ───────────────────────────────────────────────────
export function useFamilyTree() {
  const [tree,    setTree]    = useState<FamilyTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    getFamilyTree()
      .then((r) => setTree(r.tree))
      .catch((e) => setError(e?.message))
      .finally(() => setLoading(false));
  }, []);

  return { tree, loading, error };
}

// ── 4. Member Profile + Permissions ─────────────────────────────────
export function useMemberProfile(member_id: string) {
  const [profile,     setProfile]     = useState<MemberProfile | null>(null);
  const [permissions, setPermissions] = useState<MemberPermissions | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [p, perm] = await Promise.all([
        getMemberProfile(member_id),
        getMemberPermissions(member_id),
      ]);
      setProfile(p);
      setPermissions(perm.permissions);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load member profile');
    } finally {
      setLoading(false);
    }
  }, [member_id]);

  useEffect(() => { load(); }, [load]);

  const savePermissions = useCallback(async (updated: Partial<MemberPermissions>) => {
    const res = await updateMemberPermissions(member_id, updated);
    setPermissions(res.updated_permissions);
  }, [member_id]);

  const remove = useCallback(() => removeFamilyMember(member_id), [member_id]);

  return { profile, permissions, loading, error, refresh: load, savePermissions, remove };
}

// ── 5. Family AI Assistant ───────────────────────────────────────────
export function useFamilyAI() {
  const [answer,      setAnswer]      = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    getAISuggestions().then((r) => setSuggestions(r.suggestions));
  }, []);

  const ask = useCallback(async (question: string) => {
    setLoading(true);
    setAnswer(null);
    try {
      const r = await askFamilyAI(question);
      setAnswer(r.answer);
    } catch {
      setAnswer('Unable to get a response right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setAnswer(null), []);

  return { answer, suggestions, loading, ask, clear };
}
