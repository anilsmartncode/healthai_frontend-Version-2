/**
 * constants/plans.ts
 * Defines the limits for Free and Premium tiers.
 * Modify these limits per hospital/client deployment.
 */

export type PlanType = 'FREE' | 'PREMIUM' | 'FAMILY';

export interface PlanLimits {
  maxDailyAiChats: number;
  maxMonthlyReports: number;
  maxDailyMedicineScans: number;
  maxFamilyMembers: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    maxDailyAiChats: 9999,
    maxMonthlyReports: 9999,
    maxDailyMedicineScans: 9999,
    maxFamilyMembers: 9999,
  },
  PREMIUM: {
    maxDailyAiChats: 9999, // Essentially unlimited
    maxMonthlyReports: 9999,
    maxDailyMedicineScans: 9999,
    maxFamilyMembers: 9999, // Single user
  },
  FAMILY: {
    maxDailyAiChats: 9999,
    maxMonthlyReports: 25,
    maxDailyMedicineScans: 9999,
    maxFamilyMembers: 5,
  },
};

// We will use this constant as our default testing plan until the backend APIs are ready.
export const DEFAULT_TESTING_PLAN: PlanType = 'FREE';
