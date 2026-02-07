# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Detour is a React Native/Expo dating app for digital nomads. Functional MVP with Convex backend, Clerk auth, and RevenueCat payments.

## Development Commands

```bash
npm start          # Start Expo development server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run web version
npm run lint       # Run ESLint

# EAS Build
eas build --platform android --profile preview     # Build Android APK
eas build --platform ios --profile preview          # Build iOS (internal)
eas build --platform android --profile production   # Production Android build
```

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Routing**: expo-router (file-based routing)
- **Backend**: Convex (real-time database + serverless functions + file storage)
- **Auth**: Clerk (phone, Google, Apple sign-in)
- **Payments**: RevenueCat (subscriptions)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State**: React Context API
- **Language**: TypeScript (strict mode enabled)
- **Fonts**: Instrument Sans/Serif (Google Fonts)

## Architecture

### Directory Structure

- `app/` - File-based routes (expo-router)
  - `onboarding/` - 18-step onboarding flow (auth, profile setup, paywall)
  - `(tabs)/` - Main app with 5 tabs (Nearby, Explore, Matches, Messages, Profile)
  - `chat/` - Chat screens for messaging
  - `help/` - Help request and offer screens
  - `settings.tsx` - App settings
  - `edit-profile.tsx` - Profile editing
  - `pending.tsx` - Pending approval screen
  - `paywall.tsx` - Trial expired paywall (see Paywall Architecture below)
- `convex/` - Convex backend (schema, mutations, queries)
  - `schema.ts` - Database schema (users, matches, messages, swipes, inviteCodes)
  - `files.ts` - File storage mutations for photo uploads
- `components/` - Reusable components
  - `ui/` - UI primitives (Button, Input, SelectionChip, OnboardingLayout, ProgressBar)
- `context/` - React Context providers (OnboardingContext, RevenueCatContext, NotificationsContext)
- `hooks/` - Custom React hooks (usePhotoUpload, useCurrentUser, etc.)
- `constants/` - Theme colors and fonts
- `assets/images/` - Icons and brand assets
- `docs/` - Project documentation (architecture, API, deployment, setup guides)

### Routing Pattern

expo-router uses file-based routing:
- `app/index.tsx` → `/` (welcome screen)
- `app/onboarding/name.tsx` → `/onboarding/name`
- `app/(tabs)/index.tsx` → main app home (Nearby tab)

The `_layout.tsx` files configure navigation (Stack for onboarding, Tabs for main app).

### State Management

Global onboarding state managed via `OnboardingContext`:
```typescript
interface OnboardingData {
  name: string;
  username: string;
  birthday: Date | null;
  gender: string;
  lookingFor: string[];
  friendsPreference: string[];
  datingPreference: string[];
  datingGoals: string[];
  lifestyle: string[];
  timeNomadic: string;
  interests: string[];
  photos: string[];
  instagram: string;
  currentLocation: string;
  futureTrip: string;
  hasCompletedOnboarding: boolean;
  joinPath: 'apply' | 'invite' | null;
  userStatus: 'none' | 'pending' | 'approved';
  inviteCode: string;
}
```

Access with `useOnboarding()` hook inside components.

### Styling with NativeWind

Use Tailwind classes via the `className` prop:
```tsx
<View className="flex-1 bg-white px-6">
  <Text className="text-2xl font-bold text-orange-primary">Hello</Text>
</View>
```

Custom colors defined in `tailwind.config.js`:
- `orange-primary`: #fd6b03 (main brand color)
- `orange-secondary`: #fd9003

### UI Component Patterns

Onboarding screens use the `OnboardingLayout` wrapper:
```tsx
<OnboardingLayout
  currentStep={3}
  totalSteps={14}
  title="Screen Title"
  subtitle="Description text"
>
  {/* Screen content */}
</OnboardingLayout>
```

Button variants: `primary`, `secondary`, `outline`, `ghost`, `accent`

### Platform-Specific Code

Files with extensions `.ios.ts`, `.android.ts`, `.web.ts` are loaded based on platform.

### Paywall Architecture

The app has two separate paywall screens for different user scenarios:

1. **Onboarding Paywall** (`app/onboarding/paywall.tsx`)
   - Shown to new users completing onboarding
   - Shown to pending users who later obtain an invite code
   - Creates user account and uploads photos after subscription
   - Routes to `/onboarding/done` (approved) or `/pending` (applied without invite)

2. **Trial Expired Paywall** (`app/paywall.tsx`)
   - Shown to existing users whose trial has ended
   - Displays "your trial has ended" messaging
   - Routes directly to `/(tabs)` after subscription
   - Includes logout option in header

**Paywall Bypass (Temporary):**
Both paywall files have `ALLOW_PAYWALL_BYPASS = true` which allows skipping the paywall during development. This is temporary while waiting for Korean Business Registration Number (BRN) to complete the App Store Connect Paid Apps Agreement. Set to `false` once the agreement is signed and RevenueCat products are fully configured.

## Current State

Functional MVP (7/10) with backend fully integrated. See `ROADMAP.md` for full details.

**Implemented:**
- Convex backend (users, matches, messages, swipes, inviteCodes)
- Clerk authentication (phone, Google, Apple sign-in)
- RevenueCat subscriptions (SDK integrated, dashboard configured with entitlements, offerings, and 7-day free trial)
- Photo cloud upload (Convex File Storage)
- Real-time messaging
- Discovery and swiping
- Push notifications (Expo Notifications)
- Edit profile screen

**Remaining for production:**
- App Store Connect Paid Apps Agreement (submitted, status "Pending User Info" in App Store Connect) - then set `ALLOW_PAYWALL_BYPASS = false` in both paywall files
- Google Play Developer account registered (identity verification pending)
- Android build in progress on EAS
- Error monitoring (Sentry)
- Testing suite

**Recently completed:**
- RevenueCat dashboard configured with entitlements, offerings, and 7-day free trial
- EAS Build configured (eas.json created, EAS CLI ready)
- Privacy policy hosted at https://junkurera13.github.io/detour/privacy-policy.html
