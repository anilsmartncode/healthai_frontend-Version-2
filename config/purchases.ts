import { Platform } from 'react-native';

/**
 * REVENUECAT CONFIGURATION
 * 
 * Replace these placeholder keys with your actual Public SDK Keys from RevenueCat.
 * See: https://app.revenuecat.com/settings/api_keys
 */
export const REVENUECAT_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || 'appl_placeholder_key',
  android: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || 'goog_placeholder_key',
};

/**
 * PRODUCT IDENTIFIERS
 * 
 * These must match EXACTLY what you configure in Apple App Store Connect 
 * and Google Play Console. They also need to be added to your RevenueCat Entitlements.
 */
export const STORE_PRODUCTS = {
  premium: {
    ios: 'healthai_premium_monthly',
    android: 'healthai_premium_monthly',
  },
  premium_1mo: {
    ios: 'healthai_premium_1mo_pass',
    android: 'healthai_premium_1mo_pass',
  },
  family: {
    ios: 'healthai_family_monthly',
    android: 'healthai_family_monthly',
  },
  family_1mo: {
    ios: 'healthai_family_1mo_pass',
    android: 'healthai_family_1mo_pass',
  }
};

/**
 * REVENUECAT ENTITLEMENTS
 * 
 * The Entitlement ID defined in RevenueCat (usually maps to one or more products).
 */
export const ENTITLEMENTS = {
  PREMIUM: 'premium',
  FAMILY: 'family',
};

export const getRevenueCatKey = () => {
  if (Platform.OS === 'ios') return REVENUECAT_KEYS.ios;
  if (Platform.OS === 'android') return REVENUECAT_KEYS.android;
  return '';
};
