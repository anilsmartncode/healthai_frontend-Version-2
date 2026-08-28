# HealthAI — Expo Starter

AI-powered health companion app scaffold (React Native + Expo Router + TypeScript).

## Quick start

```bash
npm install            # or: yarn / bun install
npx expo start         # opens the Expo dev tools
```

Scan the QR code with **Expo Go** on your phone (Android/iOS) to run the app.

## Folder structure

```
app/                 # expo-router file-based routes (screens)
  (auth)/            # onboarding, language, login, OTP
  (tabs)/            # main tab navigator: home, reports, ai, medicines, profile
  upload.tsx         # upload report screen
  analyzing.tsx      # AI analyzing screen
  analysis.tsx       # analysis results screen
  _layout.tsx        # root stack layout
components/          # reusable UI components
  ui/                # primitives (Button, Card, Input, Badge…)
  common/            # composed components (HealthScore, ReportItem…)
services/            # API clients (auth, reports, ai, medicines)
hooks/               # custom hooks (useAuth, useReports…)
constants/           # Colors, Layout, Strings
context/             # React Context providers (AuthContext, ThemeContext)
types/               # shared TypeScript types
utils/               # helpers (formatters, validators, storage)
config/              # env / app config
assets/              # images, fonts
plugins/             # custom Expo config plugins
scripts/             # node scripts (codegen, reset-project…)
patches/             # patch-package patches
```

## Screens included

1. Onboarding
2. Choose Language
3. Login / Sign up (phone)
4. Verify OTP
5. Home Dashboard (health score + recent reports)
6. Upload Report
7. Analyzing Report
8. Report Analysis
9. AI Assistant chat
10. Medicines list + reminders
11. Profile / Settings

All screens are scaffolded with mock data — wire `services/` to your real backend.

## Notes

- Uses **expo-router v3** (file-based routing).
- Built for **Expo SDK 51** so it runs in **Expo Go**.
- Replace placeholder PNGs in `assets/images/` with your real branding before publishing.
