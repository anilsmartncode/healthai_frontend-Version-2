# Ultimate Guide: End-to-End Expo Deployment to Google Play

This is a complete, step-by-step master reference for taking an Expo app from code to a live Google Play Store release, including Firebase setup, building, and passing strict Google Play compliance.

---

## Phase 1: Firebase Configuration (The Foundation)

Before building, your app must be registered in Firebase to use Google Sign-In and Phone OTP (Play Integrity).

### 1. Register the Apps
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create your project.
2. **Android:** Click the Android icon. Enter your **Android Package Name** (e.g., `com.smartncode.healthai`) exactly as it is in `app.json`. Click Register.
   - *CRITICAL WARNING: Never delete this app later! Deleting it changes the `mobilesdk_app_id` and permanently breaks live versions of your app.*
3. **iOS:** Click the iOS icon. Enter your **iOS Bundle ID**. Click Register.

### 2. Add the Cryptographic SHA Keys
Firebase needs to know the exact signatures of your app to allow authentication.

**Key A: The Local Expo Key (For Local Testing)**
1. In your VS Code terminal, run: `eas credentials`
2. Select **Android** ➔ select your build profile.
3. Copy the **SHA-1** and **SHA-256** fingerprints.
4. In Firebase, go to **Project Settings ➔ General**, scroll to your Android app, click **Add fingerprint**, and paste them in.

**Key B: The Google Play Key (For Production)**
1. In the **Google Play Console**, go to **Protected with Play ➔ App signing**.
2. Under **App signing key certificate**, copy the **SHA-1** and **SHA-256** fingerprints.
3. Go back to Firebase (Project Settings) and add these fingerprints right next to your Expo keys.

### 3. Download the Config Files
1. From Firebase Project Settings, download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS).
2. Place them in the root of your VS Code workspace.
3. Ensure `app.json` points to them under the `"android"` and `"ios"` blocks.

---

## Phase 2: Code Preparation & Compliance

Google Play has strict policies (like the Android 13+ Photo Picker policy). You must prepare your code before building.

### 1. The Permissions Firewall
To guarantee Google doesn't reject your app for requesting broad media permissions, add this firewall to `app.json` under `"android"`:
```json
"android": {
  "blockedPermissions": [
    "android.permission.READ_MEDIA_IMAGES",
    "android.permission.READ_MEDIA_VIDEO",
    "android.permission.READ_MEDIA_AUDIO",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE"
  ]
}
```

### 2. Bump the Version
Google Play will reject any upload that uses an old version number.
1. Open `app.json`.
2. Increment the `"version"` (e.g., `"1.0.0"` ➔ `"1.0.1"`).
3. Increment the `"versionCode"` inside the `"android"` block (e.g., `"versionCode": 6` ➔ `"versionCode": 7`).

---

## Phase 3: Building the App (EAS Build)

With Firebase configured and the code prepped, it's time to generate the production App Bundle (`.aab`).

1. Open your terminal in VS Code.
2. Run the command: `eas build -p android`
   - *(If you want to build for iOS, run: `eas build -p ios`)*
3. Wait for the build to finish (usually 10-15 minutes).
4. When it completes, the terminal will provide a link to the Expo Dashboard.
5. Click the link, click **Download**, and save the `.aab` file to your computer.

---

## Phase 4: Deploying to Google Play

Now that you have the `.aab` file, you must upload it to Google Play.

1. Open the **Google Play Console** and select your app.
2. Decide which track you want to test on. Go to **Testing ➔ Closed testing** (or Open/Internal testing).
3. Next to the "Alpha" track, click **Manage track**.
4. Click the blue **Create new release** button in the top right.
5. **Upload the File:** Drag and drop your downloaded `.aab` file into the upload box.
6. **Release Details:** 
   - *Release Name:* Enter a name (e.g., `1.0.1 (Alpha - v7)`).
   - *Release Notes:* Type what changed (e.g., "Fixed Google Auth and Phone OTP. Removed unnecessary photo permissions.").
7. Click **Next** at the bottom of the screen.
8. If there are Warnings, you can safely ignore them.
9. Click **Save** and then click **Send to review**.

---

## Phase 5: Handling Rejections & Promoting to Production

### How to Override Rejections
Google Play scans *every* testing track. If an older version (e.g., Version 4) sitting on the "Open Testing" track violates a policy, Google will block your new submissions on the "Alpha" track.
- **The Fix:** Take your brand new, compliant `.aab` file and upload it to **every single track** that contains a broken version. Submitting the clean version everywhere forces Google Play to wipe out the old broken versions globally.

### Promoting to Public Production
Once your Alpha testers confirm the app works perfectly (Auth, OTP, UI), you do **not** need to rebuild the app.
1. Go to your Alpha track in Google Play Console.
2. Click **Promote release** ➔ **Production**.
3. This sends the exact same, tested `.aab` file to the public Play Store queue!
