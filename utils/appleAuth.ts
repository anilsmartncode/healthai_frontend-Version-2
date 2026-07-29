/**
 * utils/appleAuth.ts — Safe Apple Sign-In wrapper
 * ─────────────────────────────────────────────────────
 * Uses lazy require() so the file can be imported in Expo Go
 * without crashing. Native modules are only loaded when
 * signInWithApple() is actually called.
 */

import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';

const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Initiates the Apple Sign-In flow and links it to Firebase.
 * @returns { user, idToken } or null if failed/cancelled
 */
export async function signInWithApple() {
  if (isExpoGo) {
    console.warn('[AppleAuth] Apple Sign-In is not supported in Expo Go.');
    return null;
  }

  try {
    const AppleAuthentication = require('expo-apple-authentication');
    const auth = require('@react-native-firebase/auth').default;

    // Generate a secure nonce for Firebase
    const rawNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );

    // Prompt the user to sign in with Apple
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    const { identityToken } = credential;

    if (!identityToken) {
      throw new Error('Apple Sign-In failed: no identity token returned.');
    }

    console.log('[AppleAuth] Got identity token, linking to Firebase...');

    // Create Firebase credential using the token and the RAW nonce
    const firebaseCredential = auth.AppleAuthProvider.credential(identityToken, rawNonce);

    // Sign in to Firebase
    const userCredential = await auth().signInWithCredential(firebaseCredential);
    const user = userCredential.user;
    
    // For Apple, they might pass names back on the very first login
    let displayName = user.displayName;
    if (credential.fullName && (credential.fullName.givenName || credential.fullName.familyName)) {
       displayName = `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim();
       if (displayName) {
          await user.updateProfile({ displayName });
       }
    }

    const idToken = await user.getIdToken();

    console.log('[AppleAuth] Firebase sign-in successful', user.email);

    return { user, idToken };
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      console.log('[AppleAuth] User cancelled Apple Sign-In');
      return null;
    }
    console.error('[AppleAuth] Error:', error);
    throw error;
  }
}
