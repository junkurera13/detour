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
  - `onboarding/` - 13-step onboarding flow (auth, profile setup, paywall)
  - `(tabs)/` - Main app with 5 tabs (Nearby, Explore, Matches, Messages, Profile)
  - `chat/` - Chat screens for messaging
- `convex/` - Convex backend (schema, mutations, queries)
  - `schema.ts` - Database schema (users, matches, messages, swipes, inviteCodes)
  - `files.ts` - File storage mutations for photo uploads
- `components/` - Reusable components
  - `ui/` - UI primitives (Button, Input, SelectionChip, OnboardingLayout, ProgressBar)
- `context/` - React Context providers (OnboardingContext, RevenueCatContext)
- `hooks/` - Custom React hooks (usePhotoUpload, useCurrentUser, etc.)
- `constants/` - Theme colors and fonts
- `assets/images/` - Icons and brand assets

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
  birthday: Date | null;
  gender: string;
  lookingFor: 'friends' | 'dating' | 'both' | null;
  datingPreference: string[];
  lifestyle: string[];
  timeNomadic: string;
  interests: string[];
  photos: string[];
  instagram: string;
  currentLocation: string;
  futureTrip: string;
  hasCompletedOnboarding: boolean;
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
- `orange-secondary`: #fca560

### UI Component Patterns

Onboarding screens use the `OnboardingLayout` wrapper:
```tsx
<OnboardingLayout
  step={3}
  totalSteps={13}
  title="Screen Title"
  subtitle="Description text"
>
  {/* Screen content */}
</OnboardingLayout>
```

Button variants: `primary`, `secondary`, `outline`, `ghost`

### Platform-Specific Code

Files with extensions `.ios.ts`, `.android.ts`, `.web.ts` are loaded based on platform.

## Current State

Functional MVP (7/10) with backend fully integrated. See `ROADMAP.md` for full details.

**Implemented:**
- Convex backend (users, matches, messages, swipes, inviteCodes)
- Clerk authentication (phone, Google, Apple sign-in)
- RevenueCat subscriptions (SDK integrated, needs store products)
- Photo cloud upload (Convex File Storage)
- Real-time messaging
- Discovery and swiping

**Remaining for production:**
- Push notifications
- App Store / Play Store products for RevenueCat
- Error monitoring (Sentry)
- Testing suite
