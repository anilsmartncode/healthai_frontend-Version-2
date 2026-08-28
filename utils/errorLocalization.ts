import type { TranslationKeys } from '@/context/Translations';

type TranslationFn = (key: keyof TranslationKeys) => string;

/**
 * Maps raw backend / Firebase / OAuth error objects and messages to localized translations
 */
export function getLocalizedAuthError(
  error: any,
  fallbackKey: keyof TranslationKeys,
  t: TranslationFn
): string {
  if (!error) return t(fallbackKey);

  const code = String(error.code || '').toLowerCase();
  const msg = String(typeof error === 'string' ? error : error.message || '').toLowerCase();

  // Invalid verification code / expired code
  if (
    code.includes('invalid-verification-code') ||
    msg.includes('invalid-verification-code') ||
    msg.includes('invalid verification code') ||
    msg.includes('invalid code')
  ) {
    return t('err_invalid_or_expired_code');
  }

  if (
    code.includes('code-expired') ||
    msg.includes('code-expired') ||
    msg.includes('code expired') ||
    msg.includes('session-expired')
  ) {
    return t('err_invalid_or_expired_code');
  }

  // Phone number errors
  if (
    code.includes('invalid-phone-number') ||
    msg.includes('invalid-phone-number') ||
    msg.includes('invalid phone')
  ) {
    return t('err_invalid_phone');
  }

  // Rate limiting / Quota
  if (
    code.includes('too-many-requests') ||
    msg.includes('too-many-requests') ||
    msg.includes('quota-exceeded') ||
    msg.includes('blocked all requests')
  ) {
    return t('err_too_many_requests');
  }

  // Email errors
  if (
    code.includes('email-already-in-use') ||
    msg.includes('email-already-in-use') ||
    msg.includes('email already in use')
  ) {
    return t('err_email_in_use');
  }

  if (
    code.includes('invalid-email') ||
    msg.includes('invalid-email') ||
    msg.includes('invalid email')
  ) {
    return t('err_invalid_email');
  }

  // Credentials / User not found / Wrong password
  if (
    code.includes('user-not-found') ||
    code.includes('wrong-password') ||
    code.includes('invalid-credential') ||
    msg.includes('invalid credential') ||
    msg.includes('user not found') ||
    msg.includes('wrong password')
  ) {
    return t('err_invalid_credentials');
  }

  // Network / connection errors
  if (
    code.includes('network') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    msg.includes('offline') ||
    msg.includes('internet')
  ) {
    return t('err_network');
  }

  // If no specific pattern matches, use the localized fallback
  return t(fallbackKey);
}
