/**
 * utils/guestAuth.ts
 * ─────────────────────────────────────────────────────────────
 * Firebase Anonymous Authentication helper.
 * Provides a frictionless guest login experience using Firebase
 * Anonymous Auth and supports upgrading/linking to permanent accounts.
 */

import { Platform } from 'react-native';

function getFirebaseAuth() {
  const auth = require('@react-native-firebase/auth').default;
  return auth;
}

export interface GuestAuthResult {
  success: boolean;
  idToken?: string;
  uid?: string;
  error?: string;
}

/**
 * Sign in anonymously using Firebase Auth.
 * Returns the Firebase ID Token and user UID to establish a session.
 */
export const signInAsGuest = async (): Promise<GuestAuthResult> => {
  try {
    const auth = getFirebaseAuth();
    
    // Check if there is already an active anonymous user on this device
    const currentUser = auth().currentUser;
    if (currentUser && currentUser.isAnonymous) {
      const idToken = await currentUser.getIdToken(true);
      return {
        success: true,
        idToken,
        uid: currentUser.uid,
      };
    }

    // Otherwise sign in anonymously
    const userCredential = await auth().signInAnonymously();
    const idToken = await userCredential.user.getIdToken();

    return {
      success: true,
      idToken,
      uid: userCredential.user.uid,
    };
  } catch (error: any) {
    console.warn('[GuestAuth] signInAsGuest error:', error);
    return {
      success: false,
      error: error?.message || 'Failed to sign in as guest',
    };
  }
};
