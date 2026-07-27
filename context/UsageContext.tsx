import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PLAN_LIMITS, DEFAULT_TESTING_PLAN, PlanType } from '../constants/plans';
import Purchases from 'react-native-purchases';
import { ENTITLEMENTS, STORE_PRODUCTS } from '@/config/purchases';

interface UsageStats {
  aiChatsToday: number;
  reportsThisMonth: number;
  medicineScansToday: number;
  familyMembers: number;
  lastResetDate: string; // ISO date string for daily resets
  lastResetMonth: string; // YYYY-MM string for monthly resets
}

const DEFAULT_STATS: UsageStats = {
  aiChatsToday: 0,
  reportsThisMonth: 0,
  medicineScansToday: 0,
  familyMembers: 0,
  lastResetDate: new Date().toISOString().split('T')[0],
  lastResetMonth: new Date().toISOString().slice(0, 7),
};

interface UsageContextType {
  activePlan: PlanType;
  stats: UsageStats;
  canSendAiChat: () => boolean;
  incrementAiChat: () => Promise<void>;
  canUploadReport: () => boolean;
  incrementReportUpload: () => Promise<void>;
  canScanMedicine: () => boolean;
  incrementMedicineScan: () => Promise<void>;
  canAddFamilyMember: () => boolean;
  incrementFamilyMember: () => Promise<void>;
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
  upgradeToPremium: () => Promise<void>;
  upgradeToFamily: () => Promise<void>;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

const USAGE_STORAGE_KEY = '@healthai_usage_stats';

export function UsageProvider({ children }: { children: React.ReactNode }) {
  // For R&D, we mock the active plan. Later, fetch this from AuthContext/Backend.
  const [activePlan, setActivePlan] = useState<PlanType>(DEFAULT_TESTING_PLAN);
  const [stats, setStats] = useState<UsageStats>(DEFAULT_STATS);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const stored = await AsyncStorage.getItem(USAGE_STORAGE_KEY);
      if (stored) {
        const parsed: UsageStats = JSON.parse(stored);
        
        // Check for daily/monthly resets
        const todayDate = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().slice(0, 7);

        let needsSave = false;
        if (parsed.lastResetDate !== todayDate) {
          parsed.aiChatsToday = 0;
          parsed.medicineScansToday = 0;
          parsed.lastResetDate = todayDate;
          needsSave = true;
        }
        if (parsed.lastResetMonth !== currentMonth) {
          parsed.reportsThisMonth = 0;
          parsed.lastResetMonth = currentMonth;
          needsSave = true;
        }

        setStats(parsed);
        if (needsSave) {
          await AsyncStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(parsed));
        }
      }
      
      // Fetch RevenueCat status
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        if (typeof customerInfo.entitlements.active[ENTITLEMENTS.FAMILY] !== "undefined") {
          setActivePlan('FAMILY');
          await AsyncStorage.setItem('@healthai_active_plan', 'FAMILY');
        } else if (typeof customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !== "undefined") {
          setActivePlan('PREMIUM');
          await AsyncStorage.setItem('@healthai_active_plan', 'PREMIUM');
        } else {
          setActivePlan('FREE');
          await AsyncStorage.setItem('@healthai_active_plan', 'FREE');
        }
      } catch (e) {
        console.warn('RevenueCat sync failed, falling back to cached plan:', e);
        const storedPlan = await AsyncStorage.getItem('@healthai_active_plan');
        if (storedPlan === 'PREMIUM' || storedPlan === 'FREE' || storedPlan === 'FAMILY') {
          setActivePlan(storedPlan as PlanType);
        }
      }
    } catch (e) {
      console.log('Error loading usage stats:', e);
    }
  };

  const saveStats = async (newStats: UsageStats) => {
    setStats(newStats);
    await AsyncStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(newStats));
  };

  const upgradeToPremium = async () => {
    try {
      // In a real flow, you would fetch offerings and purchase the specific package.
      // Here we simulate picking the Premium product for testing integration.
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        // Find package mapping to premium
        const premiumPackage = offerings.current.availablePackages.find(p => 
          p.product.identifier === STORE_PRODUCTS.premium.ios || p.product.identifier === STORE_PRODUCTS.premium.android
        ) || offerings.current.availablePackages[0];
        
        const { customerInfo } = await Purchases.purchasePackage(premiumPackage);
        if (typeof customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !== "undefined") {
          setActivePlan('PREMIUM');
          await AsyncStorage.setItem('@healthai_active_plan', 'PREMIUM');
        }
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('Purchase failed:', e);
        throw e;
      }
    }
  };

  const upgradeToFamily = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        // Find package mapping to family
        const familyPackage = offerings.current.availablePackages.find(p => 
          p.product.identifier === STORE_PRODUCTS.family.ios || p.product.identifier === STORE_PRODUCTS.family.android
        ) || offerings.current.availablePackages[1] || offerings.current.availablePackages[0];
        
        const { customerInfo } = await Purchases.purchasePackage(familyPackage);
        if (typeof customerInfo.entitlements.active[ENTITLEMENTS.FAMILY] !== "undefined") {
          setActivePlan('FAMILY');
          await AsyncStorage.setItem('@healthai_active_plan', 'FAMILY');
        }
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('Purchase failed:', e);
        throw e;
      }
    }
  };

  // --- AI Chat ---
  const canSendAiChat = () => {
    return stats.aiChatsToday < PLAN_LIMITS[activePlan].maxDailyAiChats;
  };
  const incrementAiChat = async () => {
    await saveStats({ ...stats, aiChatsToday: stats.aiChatsToday + 1 });
  };

  // --- Reports ---
  const canUploadReport = () => {
    return stats.reportsThisMonth < PLAN_LIMITS[activePlan].maxMonthlyReports;
  };
  const incrementReportUpload = async () => {
    await saveStats({ ...stats, reportsThisMonth: stats.reportsThisMonth + 1 });
  };

  // --- Medicine Scans ---
  const canScanMedicine = () => {
    return stats.medicineScansToday < PLAN_LIMITS[activePlan].maxDailyMedicineScans;
  };
  const incrementMedicineScan = async () => {
    await saveStats({ ...stats, medicineScansToday: stats.medicineScansToday + 1 });
  };

  // --- Family Members ---
  const canAddFamilyMember = () => {
    return stats.familyMembers < PLAN_LIMITS[activePlan].maxFamilyMembers;
  };
  const incrementFamilyMember = async () => {
    await saveStats({ ...stats, familyMembers: stats.familyMembers + 1 });
  };

  return (
    <UsageContext.Provider
      value={{
        activePlan,
        stats,
        canSendAiChat,
        incrementAiChat,
        canUploadReport,
        incrementReportUpload,
        canScanMedicine,
        incrementMedicineScan,
        canAddFamilyMember,
        incrementFamilyMember,
        showPaywall,
        setShowPaywall,
        upgradeToPremium,
        upgradeToFamily,
      }}
    >
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage() {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error('useUsage must be used within a UsageProvider');
  }
  return context;
}
