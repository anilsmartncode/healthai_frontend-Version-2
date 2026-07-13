/**
 * utils/googleAuth.ts — Safe Google Sign-In wrapper
 * ─────────────────────────────────────────────────────
 * Uses lazy require() so the file can be imported in Expo Go
 * without crashing. Native modules are only loaded when
 * signInWithGoogle() is actually called.
 */

import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';
let _configured = false;

// Configure early so native modules register the webClientId before sign-in is clicked
if (!isExpoGo) {
  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    GoogleSignin.configure({
      webClientId: '933979596939-kbakttimkce7033728vfank66tgimu7f.apps.googleusercontent.com',
      iosClientId: '933979596939-68suovtthpu7b3sitqlc2p692hgfe14a.apps.googleusercontent.com',
      offlineAccess: true,
    });
    _configured = true;
  } catch (e) {
    console.log("Could not configure Google Sign-In globally", e);
  }
}

function getGoogleSignin() {
  const { GoogleSignin } = require('@react-native-google-signin/google-signin');
  if (!_configured) {
    GoogleSignin.configure({
      webClientId: '933979596939-kbakttimkce7033728vfank66tgimu7f.apps.googleusercontent.com',
      iosClientId: '933979596939-68suovtthpu7b3sitqlc2p692hgfe14a.apps.googleusercontent.com',
      offlineAccess: true,
    });
    _configured = true;
  }
  return GoogleSignin;
}

function getFirebaseAuth() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const auth = require('@react-native-firebase/auth').default;
  return auth;
}

export const signInWithGoogle = async () => {
  try {
    const GoogleSignin = getGoogleSignin();
    const { statusCodes } = require('@react-native-google-signin/google-signin');
    const auth = getFirebaseAuth();

    await GoogleSignin.hasPlayServices();

    // Step 1: Open the Google account picker and let the user sign in
    const userInfo = await GoogleSignin.signIn();
    console.log('[GoogleAuth] signIn result keys:', Object.keys(userInfo || {}));

    // Step 2: Extract the idToken.
    // v16+ of @react-native-google-signin changed the response shape.
    // signIn() may no longer include idToken directly — we must try
    // getTokens() as a fallback.
    let gToken: string | null =
      (userInfo as any)?.idToken ||
      (userInfo as any)?.data?.idToken ||
      null;

    if (!gToken) {
      try {
        const tokens = await GoogleSignin.getTokens();
        console.log('[GoogleAuth] getTokens result keys:', Object.keys(tokens || {}));
        gToken = tokens?.idToken || null;
      } catch (tokenErr) {
        console.log('[GoogleAuth] getTokens() failed:', tokenErr);
      }
    }

    if (!gToken) {
      throw new Error(
        'Google Sign-In succeeded but no ID Token was returned. ' +
        'Ensure the webClientId matches your OAuth 2.0 Web Client ID in Google Cloud Console, ' +
        'and that the SHA-1 fingerprint of this APK is registered in Firebase.'
      );
    }

    console.log('[GoogleAuth] Got idToken, length:', gToken.length);

    // Create a Google credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(gToken);

    // Sign-in the user with the credential
    const userCredential = await auth().signInWithCredential(googleCredential);
    const firebaseIdToken = await userCredential.user.getIdToken();

    return {
      success: true,
      idToken: firebaseIdToken,
      user: userCredential.user,
    };
  } catch (error: any) {
    console.log("Google Sign-In Error:", error);
    try {
      const { statusCodes } = require('@react-native-google-signin/google-signin');
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { success: false, error: 'Sign-in cancelled' };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return { success: false, error: 'Sign-in in progress' };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { success: false, error: 'Play services not available' };
      }
    } catch (_) { /* statusCodes not available in Expo Go */ }
    return { success: false, error: error.message || 'Google Sign-In failed' };
  }
};

