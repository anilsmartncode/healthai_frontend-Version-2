/**
 * useProfile.ts  —  React hook(s) for the family member sub-screens
 *
 * services/profileSubScreenApi.ts (~29KB) exposes per-member data:
 *   health summary, reports, medications, appointments, AI insights,
 *   emergency details — each fetched by member_id with the same
 *   shape: { data, loading, error }.
 *
 * Previously every sub-screen (health-summary.tsx, reports.tsx,
 * medications.tsx, appointments.tsx, ai-insights.tsx, emergency.tsx)
 * duplicated this same useState/useEffect/try-catch block by hand.
 *
 * useFamilyMemberData() factors that out into one generic hook so all
 * six screens share identical loading/error/refetch behaviour — same
 * convention as useReports (home tab) and useFamily (family dashboard).
 *
 * Usage (replaces the old useEffect block 1:1):
 *
 *   const { data, loading, error, refetch } =
 *     useFamilyMemberData(id, getMemberHealthSummary);
 */

import { useCallback, useEffect, useState } from 'react';

export function useFamilyMemberData<T>(
  memberId: string,
  fetcher: (memberId: string) => Promise<T>,
) {
  const [data, setData]       = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher(memberId);
      setData(result);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
    // fetcher is expected to be a stable top-level function reference
    // (e.g. getMemberHealthSummary) — only memberId should retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
}

// ─── Convenience wrappers for each sub-screen ──────────────────────────────
// Thin, named wrappers so call sites read clearly (useHealthSummary(id) vs.
// useFamilyMemberData(id, getMemberHealthSummary)) while still sharing the
// one implementation above.

import {
  getMemberHealthSummary,
  getMemberReports,
  getMemberMedications,
  getMemberAppointments,
  getMemberAIInsights,
  getMemberEmergency,
} from '@/services/profileSubScreenApi';

export const useHealthSummary  = (memberId: string) => useFamilyMemberData(memberId, getMemberHealthSummary);
export const useMemberReports  = (memberId: string) => useFamilyMemberData(memberId, getMemberReports);
export const useMedications    = (memberId: string) => useFamilyMemberData(memberId, getMemberMedications);
export const useAppointments   = (memberId: string) => useFamilyMemberData(memberId, getMemberAppointments);
export const useAIInsights     = (memberId: string) => useFamilyMemberData(memberId, getMemberAIInsights);
export const useEmergencyInfo  = (memberId: string) => useFamilyMemberData(memberId, getMemberEmergency);
