/**
 * utils/googleAuth.ts — Safe Google Sign-In wrapper
 * ─────────────────────────────────────────────────────
 * Uses lazy require() so the file can be imported in Expo Go
 * without crashing. Native modules are only loaded when
 * signInWithGoogle() is actually called.
 *
 * v16 fix: GoogleAuthProvider.credential(idToken, accessToken)
 * needs at least ONE non-null token. v16 of @react-native-google-signin
 * often returns null for idToken but a valid accessToken — so we now
 * capture both and pass both to Firebase.
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
  const auth = require('@react-native-firebase/auth').default;
  return auth;
}

export const signInWithGoogle = async () => {
  try {
    const GoogleSignin = getGoogleSignin();
    const auth = getFirebaseAuth();

    await GoogleSignin.hasPlayServices();

    // Step 1: Force account picker by clearing the previous session
    // This prevents Google from automatically picking the last used account
    try {
      await GoogleSignin.signOut();
    } catch (e) {
      // Ignore errors here (e.g. if no user was signed in yet)
    }

    // Step 2: Open the Google account picker
    const userInfo = await GoogleSignin.signIn();
    console.log('[GoogleAuth] signIn result keys:', Object.keys(userInfo || {}));

    // Step 2: Extract idToken + accessToken from signIn() response
    // v16 changed the response shape — tokens might be nested under .data
    let idToken: string | null =
      (userInfo as any)?.idToken ||
      (userInfo as any)?.data?.idToken ||
      null;
    let accessToken: string | null =
      (userInfo as any)?.accessToken ||
      (userInfo as any)?.data?.accessToken ||
      null;

    // Step 3: If either token is missing, fetch from getTokens()
    // In v16, getTokens() returns { idToken, accessToken }
    // idToken may be null but accessToken is usually present
    if (!idToken || !accessToken) {
      try {
        const tokens = await GoogleSignin.getTokens();
        console.log('[GoogleAuth] getTokens:', {
          hasIdToken: !!tokens?.idToken,
          hasAccessToken: !!tokens?.accessToken,
        });
        if (!idToken) idToken = tokens?.idToken || null;
        if (!accessToken) accessToken = tokens?.accessToken || null;
      } catch (tokenErr) {
        console.log('[GoogleAuth] getTokens() failed:', tokenErr);
      }
    }

    console.log('[GoogleAuth] final tokens:', { hasIdToken: !!idToken, hasAccessToken: !!accessToken });

    // Step 4: At least one token must be non-null for Firebase
    if (!idToken && !accessToken) {
      throw new Error(
        'Google Sign-In completed but returned no tokens. ' +
        'Ensure the webClientId is the Web OAuth Client ID from Firebase Console.'
      );
    }

    // Step 5: Create Firebase credential — passes both tokens,
    // Firebase uses whichever is available (idToken preferred)
    const googleCredential = auth.GoogleAuthProvider.credential(idToken, accessToken);

    // Step 6: Sign in to Firebase with the Google credential
    const userCredential = await auth().signInWithCredential(googleCredential);

    // Step 7: Get the Firebase ID Token to send to your backend
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
