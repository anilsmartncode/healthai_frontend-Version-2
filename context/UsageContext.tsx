import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PLAN_LIMITS, DEFAULT_TESTING_PLAN, PlanType } from '../constants/plans';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { ENTITLEMENTS, STORE_PRODUCTS, getRevenueCatKey } from '@/config/purchases';

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
  restorePurchases: () => Promise<boolean>;
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

  const ensureRevenueCat = async () => {
    const isConfigured = await Purchases.isConfigured();
    if (!isConfigured) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      const apiKey = getRevenueCatKey();
      if (apiKey) {
        Purchases.configure({ apiKey });
      }
    }
  };

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
        await ensureRevenueCat();
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

  const traceAlert = (title: string, msg: string): Promise<void> => {
    return new Promise(resolve => {
      Alert.alert(title, msg, [{ text: 'Next', onPress: () => resolve() }]);
    });
  };

  const upgradeToPremium = async () => {
    try {
      await traceAlert('Trace 1/4', 'Connecting to RevenueCat...');
      await ensureRevenueCat();
      
      await traceAlert('Trace 2/4', 'RevenueCat connected. Fetching packages from Apple...');
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        const premiumPackage = offerings.current.availablePackages.find(p => 
          p.product.identifier === STORE_PRODUCTS.premium.ios || p.product.identifier === STORE_PRODUCTS.premium.android
        ) || offerings.current.availablePackages[0];
        
        await traceAlert('Trace 3/4', `Found package: ${premiumPackage.product.identifier}.\n\nSending request to App Store. Please authenticate when prompted...`);
        
        const { customerInfo } = await Purchases.purchasePackage(premiumPackage);
        
        await traceAlert('Trace 4/4', 'App Store purchase successful!\n\nVerifying entitlements with RevenueCat...');
        
        if (typeof customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !== "undefined") {
          setActivePlan('PREMIUM');
          await AsyncStorage.setItem('@healthai_active_plan', 'PREMIUM');
          Alert.alert('Success', 'Upgraded to Premium!');
        } else {
          Alert.alert('Entitlement Failed', 'App Store purchase succeeded, but RevenueCat did not grant the Premium entitlement. Check your RevenueCat Entitlement mapping.');
        }
      } else {
        Alert.alert('Configuration Error', 'No offerings found in RevenueCat. Check App Store Connect agreements and product IDs.');
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('Purchase failed:', e);
        Alert.alert('Payment Failed', `The process stopped here with this error:\n\nCode: ${e.code}\nMessage: ${e.message}\n\nUnderlying Error: ${e.underlyingErrorMessage || 'None'}`);
        throw e;
      } else {
        Alert.alert('Cancelled', 'Payment was cancelled by the user.');
      }
    }
  };

  const upgradeToFamily = async () => {
    try {
      await traceAlert('Trace 1/4', 'Connecting to RevenueCat...');
      await ensureRevenueCat();
      
      await traceAlert('Trace 2/4', 'RevenueCat connected. Fetching packages from Apple...');
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        const familyPackage = offerings.current.availablePackages.find(p => 
          p.product.identifier === STORE_PRODUCTS.family.ios || p.product.identifier === STORE_PRODUCTS.family.android
        ) || offerings.current.availablePackages[1] || offerings.current.availablePackages[0];
        
        await traceAlert('Trace 3/4', `Found package: ${familyPackage.product.identifier}.\n\nSending request to App Store. Please authenticate when prompted...`);
        
        const { customerInfo } = await Purchases.purchasePackage(familyPackage);
        
        await traceAlert('Trace 4/4', 'App Store purchase successful!\n\nVerifying entitlements with RevenueCat...');
        
        if (typeof customerInfo.entitlements.active[ENTITLEMENTS.FAMILY] !== "undefined") {
          setActivePlan('FAMILY');
          await AsyncStorage.setItem('@healthai_active_plan', 'FAMILY');
          Alert.alert('Success', 'Upgraded to Family Plan!');
        } else {
          Alert.alert('Entitlement Failed', 'App Store purchase succeeded, but RevenueCat did not grant the Family entitlement. Check your RevenueCat Entitlement mapping.');
        }
      } else {
        Alert.alert('Configuration Error', 'No offerings found in RevenueCat.');
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('Purchase failed:', e);
        Alert.alert('Payment Failed', `The process stopped here with this error:\n\nCode: ${e.code}\nMessage: ${e.message}\n\nUnderlying Error: ${e.underlyingErrorMessage || 'None'}`);
        throw e;
      } else {
        Alert.alert('Cancelled', 'Payment was cancelled by the user.');
      }
    }
  };

  const restorePurchases = async () => {
    try {
      await ensureRevenueCat();
      const customerInfo = await Purchases.restorePurchases();
      let restored = false;
      if (typeof customerInfo.entitlements.active[ENTITLEMENTS.FAMILY] !== "undefined") {
        setActivePlan('FAMILY');
        await AsyncStorage.setItem('@healthai_active_plan', 'FAMILY');
        restored = true;
      } else if (typeof customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !== "undefined") {
        setActivePlan('PREMIUM');
        await AsyncStorage.setItem('@healthai_active_plan', 'PREMIUM');
        restored = true;
      }
      return restored;
    } catch (e) {
      console.error('Failed to restore purchases:', e);
      throw e;
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
        restorePurchases,
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
