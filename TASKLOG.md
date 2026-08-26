# HealthAI Frontend — Task Log

> Running log of all development tasks, fixes, security changes, and improvements made to the SMARTnCODE HealthAI frontend project.
> Maintained by: **Anil**

---

## Legend

| Tag | Meaning |
|---|---|
| Security | Security hardening, auth, biometric |
| Bug Fix | Defect fix, crash prevention |
| QA / Testing | Automated tests, type checks |
| Architecture | Structural or config changes |
| Restore | Reverting a temporary change |

---

## 2026-08-24

### [QA] Automated Type-Check & Bug Fixes (Full Codebase Sweep)
- **Type:** QA / Testing + Bug Fix
- **Description:** Ran strict TypeScript type-check (npx tsc --noEmit) over the entire frontend codebase. Found and fixed 10 bugs and inconsistencies between UI and backend API shapes.
- **Fixes Applied:**

  | # | Area | Fix |
  |---|---|---|
  | 1 | Prescription Warnings | Fixed medicine.rx === "Rx" — backend returns boolean; corrected PrescriptionType definition so warnings render correctly in Scanner & Interaction UI |
  | 2 | Scanner History | Fixed ScanHistoryItem type — was reading wrong field names (medicineType, scannedAt) vs actual backend fields (medicineId, aiSummary, createdAt) |
  | 3 | Push Notifications | Updated medicine reminder trigger syntax from deprecated { date } to modern { type: Notifications.SchedulableTriggerInputTypes.DATE, date } |
  | 4 | Family Reports | Fixed vital signs rendering blank — name vs label field mismatch |
  | 5 | Notifications List | Fixed crash on missing body property in push notification list items |
  | 6 | Analysis Screen | Fixed missing parameter declarations causing potential production build failure |

- **Result:** npx tsc --noEmit returns a 100% clean build — zero errors or warnings.
- **Files:** Multiple files across app/, components/, services/, types/

---

### [SECURITY] Restore Production Security Restrictions
- **Type:** Restore / Fix
- **Description:** Production security features that had been temporarily commented out (for screenshot/demo purposes) were fully re-enabled. Three areas were restored:

  | Feature | Before (Disabled) | After (Restored) |
  |---|---|---|
  | Biometric lock (cold start + inactivity) | DISABLE_SECURITY = true | DISABLE_SECURITY = false |
  | Inactivity auto-lock timeout | 10 seconds (test value) | 5 * 60 * 1000 ms = 5 minutes |
  | Screen capture prevention | usePreventScreenCapture() commented out | Re-enabled and active |
  | Web route restriction | Entire restriction block commented out | Restored — only /privacy, /terms, /cookies, /contact, /support, /accountanddata accessible on web; all other routes show Get the App overlay |

- **Files:** components/SecurityWrapper.tsx, app/_layout.tsx

---

### [BUG] reportsApi.ts parseHealthScore Hardening
- **Type:** Bug Fix / Defensive Coding
- **Description:** Reviewed git diff on services/reportsApi.ts. Two defensive hardening fixes were applied:
  1. Falsy check fix: Changed !summary?.health_score to == null so a health score of 0 no longer incorrectly short-circuits.
  2. parseInt safety: Added String() wrapper and explicit radix 10 to parseInt to correctly handle numeric health_score values and prevent octal parsing edge cases.
- **Files:** services/reportsApi.ts

---

---

## 2026-08-20 (Thursday)

### [APP STORE] Apple Rejection Fix — v1.0.2 Resubmission (6 Issues Fixed)
- **Type:** App Store Compliance / Release
- **Context:** Apple rejected HealthAI v1.0 (build 25) on 6 grounds. All code issues were fixed, version bumped to 1.0.2 (versionCode 8), and resubmitted on Aug 20.
- **Current Status:** Waiting for Review (in queue since Aug 20 at 6:02 PM IST)

#### Issue 1 — Google Login Crash on iPad [Guideline 2.1a] — FIXED
- **Root Cause:** hasPlayServices() called unconditionally — Android-only method, crashes on iOS/iPad
- **Fix:** Guarded hasPlayServices() to Android-only using Platform.OS check; added defensive try/catch around entire native sign-in flow
- **File:** services/googleAuth.ts

#### Issue 2 — AI Data-Sharing Disclosure [Guidelines 5.1.1i / 5.1.2i] — FIXED
- **Root Cause:** App sent health data to AI backend without explicit in-app disclosure of what data is sent, who processes it, or user consent
- **Fix:**
  - Created new AIDataConsentModal shown once before first AI interaction (persisted via AsyncStorage)
  - Updated AnalysisPermissionModal in upload.tsx — removed false "no third-party sharing" claim, added accurate disclosure
  - askAI() in aiService.ts now blocks until consent is granted; useAI.ts updated accordingly
  - privacy.tsx updated with AI data processing section
  - terms.tsx updated with AI data-sharing disclosure in AI section
- **Files:** components/ai/AIDataConsentModal.tsx (NEW), upload.tsx, aiService.ts, useAI.ts, privacy.tsx, terms.tsx

#### Issue 3 — Camera Purpose String Too Vague [Guideline 5.1.1ii] — FIXED
- **Root Cause:** expo-image-picker had no explicit cameraPermission string — fell back to Apple's generic default
- **Fix:** Added descriptive cameraPermission: "HealthAI needs camera access so you can take a photo of your medical report or prescription for AI analysis."
- **File:** app.json

#### Issue 4 — IAP Products Not Submitted [Guideline 2.1b] — MANUAL (App Store Connect)
- **Action Required by Anil:**
  - Add App Review Screenshots to each IAP product (healthai_premium_monthly, healthai_family_monthly)
  - Ensure both products are "Ready to Submit" and included in the submission
- **Status:** Manual action in App Store Connect

#### Issue 5 — Missing EULA/Terms Link for Subscriptions [Guideline 3.1.2c] — FIXED (Code + Manual)
- **Code Fix in plans.tsx:**
  - Added "Auto-renewable monthly subscription" label under each plan name
  - Added Apple-required subscription disclosure boilerplate (payment charged to Apple ID, auto-renews unless cancelled 24h before period end)
  - Renamed "Terms of Service" -> "Terms of Use (EULA)" link
- **Manual (App Store Connect):** Add https://healthai.smartncode.com/terms to the EULA field in App Store metadata
- **File:** plans.tsx

#### Issue 6 — Age Rating "Parental Controls" [Guideline 2.3.6] — MANUAL (App Store Connect)
- **Action Required by Anil:** Change "Parental Controls" to "None" in App Store Connect > App Information > Age Rating
- **Status:** Manual action in App Store Connect

#### Version Bump
- **Version:** 1.0.1 -> 1.0.2
- **versionCode:** 7 -> 8
- **File:** app.json

#### Pending Manual Steps (App Store Connect)
| # | Action | Status |
|---|---|---|
| 1 | Submit IAP products with review screenshots | Pending |
| 2 | Add EULA link (https://healthai.smartncode.com/terms) to App Store metadata | Pending |
| 3 | Set Age Rating "Parental Controls" to "None" | Pending |

---

_Last updated: 2026-08-24 by Anil_
