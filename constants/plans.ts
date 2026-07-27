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
    maxDailyAiChats: 3,
    maxMonthlyReports: 1,
    maxDailyMedicineScans: 1,
    maxFamilyMembers: 1,
  },
  PREMIUM: {
    maxDailyAiChats: 9999, // Essentially unlimited
    maxMonthlyReports: 10,
    maxDailyMedicineScans: 9999,
    maxFamilyMembers: 0, // Single user
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
