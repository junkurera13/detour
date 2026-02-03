# Detour

Detour is a React Native (Expo) dating app for digital nomads. This repo contains the mobile client, built with Expo Router, Clerk auth, Convex backend, and RevenueCat for subscriptions.

**Stack**
- Expo SDK 54 + React Native
- Expo Router
- Clerk Authentication
- Convex (DB + functions)
- RevenueCat subscriptions
- NativeWind styling

**Requirements**
- Node.js 18+
- npm 9+
- Xcode (iOS) or Android Studio (Android)

**Setup**
1. Install dependencies

   ```bash
   npm install
   ```

2. Create local env file

   ```bash
   cp .env.example .env.local
   ```

3. Fill in env variables (see `.env.example`)

4. Start the app

   ```bash
   npx expo start
   ```

**Environment variables**
Set these in `.env.local` (local) or EAS secrets (cloud builds):
- `EXPO_PUBLIC_APP_ENV`
- `EXPO_PUBLIC_CONVEX_URL`
- `EXPO_PUBLIC_CONVEX_SITE_URL`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`

**Development builds**
RevenueCat requires a development build to test purchases. Expo Go runs the SDK in Preview API mode.

**Scripts**
- `npm run start` Start Expo dev server
- `npm run ios` Run on iOS simulator
- `npm run android` Run on Android emulator
- `npm run web` Run on web
- `npm run lint` Lint the project
- `npm run test` Run Jest tests
- `npm run test:watch` Watch tests
- `npm run test:coverage` Coverage report

**Folder structure**
- `app/` Expo Router screens
- `components/` Shared UI and utilities
- `context/` App providers
- `hooks/` Custom hooks
- `convex/` Backend schema and functions
- `lib/` Shared helpers (env, logging)

**RevenueCat setup**
- Create products: `monthly`, `yearly`
- Create entitlement: `detour_plus`
- Create a default offering that includes both packages
- Configure App Store / Play Console products and connect them in RevenueCat

**Contributing**
See `CONTRIBUTING.md` for branch, commit, and PR guidelines.
